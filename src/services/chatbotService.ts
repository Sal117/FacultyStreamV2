// src/services/chatbotService.ts
export const chatbotService = {
  async getChatbotResponse(input: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from server:', errorData.error);
        return 'Sorry, I encountered an issue processing your request.';
      }

      const data = await response.json();
      return data.text || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      return 'Sorry, I encountered an issue processing your request.';
    }
  },
};
