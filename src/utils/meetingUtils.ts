// Generate a random string of specified length
const generateRandomString = (length: number): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate a Google Meet link with 6 random letters
export const generateGoogleMeetLink = (): string => {
  const randomPart = generateRandomString(6);
  return `meet.google.com/${randomPart}`;
};
