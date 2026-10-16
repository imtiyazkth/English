import '@testing-library/jest-dom/vitest';

// jsdom does not implement these; components call them.
window.scrollTo = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
