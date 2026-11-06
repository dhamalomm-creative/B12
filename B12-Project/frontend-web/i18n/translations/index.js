import ui from './ui';
import questions from './questions';
import foods from './foods';

// Each entry is 'English text': ['हिन्दी', 'मराठी']
const translations = { ...ui, ...questions, ...foods };

export default translations;
