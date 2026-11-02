/**
 * End-to-end API tests (needs a real PostgreSQL with supabase_setup.sql applied).
 * Run: DATABASE_URL=... JWT_SECRET=... npm test
 */
const request = require('supertest');
const app = require('../server');

const EMAIL = `e2e_${Date.now()}@b12.test`;
const PASSWORD = 'Strong<Pass>1&';
let token = '';

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('auth + profile', () => {
  it('registers with profile data', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: EMAIL, password: PASSWORD, name: 'Asha', age: 30, gender: 'female', dietType: 'vegetarian',
    });
    expect(res.status).toBe(201);
    token = res.body.token;
    expect(token).toBeDefined();
  });

  it('logs in with a password containing HTML characters (not mangled by XSS filter)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    token = res.body.token;
  });

  it('sanitizes HTML in profile name', async () => {
    const res = await request(app).post('/api/users/profile').set(auth()).send({ name: '<script>x</script>Asha' });
    expect(res.status).toBeLessThan(300);
    const p = await request(app).get('/api/users/profile').set(auth());
    expect(p.body.profile.name).not.toContain('<script>');
  });

  it('rejects an invalid gender', async () => {
    const res = await request(app).post('/api/users/profile').set(auth()).send({ gender: 'robot' });
    expect(res.status).toBe(400);
  });

  it('allows a body-less POST (logout-style) without Content-Type', async () => {
    const res = await request(app).post('/api/auth/logout').set({ Authorization: 'Bearer nope' });
    expect(res.status).toBe(401); // auth fails, but NOT 415
  });
});

describe('questionnaire', () => {
  it('scores a v2 (web) submission and stores it', async () => {
    const res = await request(app).post('/api/questionnaire/submit').set(auth()).send({
      answers: [
        { questionKey: 'fatigue_frequency', answerValue: 'often' },
        { questionKey: 'tingling_numbness', answerValue: 'sometimes' },
        { questionKey: 'b12_food_intake', answerValue: 'weekly' },
        { questionKey: 'supplement_use', answerValue: 'no' },
        { questionKey: 'medications', answerValue: 'one' },
      ],
    });
    expect(res.status).toBe(200);
    expect(['low', 'medium', 'high']).toContain(res.body.risk_level);
    expect(res.body.scoring_version).toBe('2.0');
    expect(res.body.breakdown.diet).toBeGreaterThan(0);
  });

  it('rejects unknown v2 answers', async () => {
    const res = await request(app).post('/api/questionnaire/submit').set(auth()).send({
      answers: [{ questionKey: 'fatigue_frequency', answerValue: 'hacked' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate v2 answers', async () => {
    const res = await request(app).post('/api/questionnaire/submit').set(auth()).send({
      answers: [
        { questionKey: 'mood', answerValue: 'never' },
        { questionKey: 'mood', answerValue: 'always' },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('still accepts v1 (Android) submissions', async () => {
    const res = await request(app).post('/api/questionnaire/submit').set(auth()).send({
      answers: [{ questionId: 1, answerValue: 'rarely' }, { questionId: 3, answerValue: 'often' }],
    });
    expect(res.status).toBe(200);
    expect(res.body.percentage).toBeDefined();
  });

  it('returns latest + history', async () => {
    const latest = await request(app).get('/api/questionnaire/latest').set(auth());
    expect(latest.body.assessment).toBeTruthy();
    const hist = await request(app).get('/api/questionnaire/history').set(auth());
    expect(hist.body.assessments.length).toBe(2);
  });
});

describe('daily check-in', () => {
  it('allows one check-in per day, then only edits', async () => {
    const body = { energyScore: 3, fatigueScore: 1, moodScore: 3, sleepScore: 2, focusScore: 3 };
    const first = await request(app).post('/api/checkin/daily').set(auth()).send(body);
    expect(first.status).toBe(201);
    expect(first.body.isNew).toBe(true);
    expect(first.body.streak.current_streak).toBe(1);

    const second = await request(app).post('/api/checkin/daily').set(auth()).send({ ...body, energyScore: 4 });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('ALREADY_CHECKED_IN');
    expect(second.body.checkin.energy_score).toBe(3);

    const edit = await request(app).put('/api/checkin/daily').set(auth()).send({ ...body, energyScore: 4 });
    expect(edit.status).toBe(200);
    expect(edit.body.checkin.energy_score).toBe(4);
    expect(edit.body.streak.total_checkins).toBe(1);
    expect(edit.body.streak.current_streak).toBe(1);
  });

  it('rejects out-of-range scores', async () => {
    const res = await request(app).post('/api/checkin/daily').set(auth())
      .send({ energyScore: 9, fatigueScore: 1, moodScore: 3, sleepScore: 2, focusScore: 3 });
    expect(res.status).toBe(400);
  });

  it('returns history with streak', async () => {
    const res = await request(app).get('/api/checkin/history?days=14').set(auth());
    expect(res.body.logs.length).toBe(1);
    expect(res.body.streak.current_streak).toBe(1);
  });
});

describe('password + account', () => {
  it('enforces the strong password policy on change', async () => {
    const res = await request(app).post('/api/users/password').set(auth())
      .send({ currentPassword: PASSWORD, newPassword: 'weakpass' });
    expect(res.status).toBe(400);
  });

  it('does not permanently lock an account after failed logins', async () => {
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'Wrong1234' });
    }
    // Existing session token must keep working (account not deactivated)
    const res = await request(app).get('/api/users/profile').set(auth());
    expect(res.status).toBe(200);
  }, 30000);

  it('deletes the account and its data when the password is correct', async () => {
    const wrong = await request(app).delete('/api/users/me').set(auth()).send({ password: 'nope' });
    expect(wrong.status).toBe(400);
    const res = await request(app).delete('/api/users/me').set(auth()).send({ password: PASSWORD });
    expect(res.status).toBe(200);
    const after = await request(app).get('/api/users/profile').set(auth());
    expect(after.status).toBe(401);
  });
});
