import OpenAI from 'openai';

// Initialize OpenAI configuration
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Ensure the environment variable is correctly set
    dangerouslyAllowBrowser: true, // This is necessary when running OpenAI in a browser environment
});

export const openaiService = {
    // Get chatbot response using OpenAI's GPT model
    async getChatbotResponse(input: string): Promise<string> {
        try {
            // Add a delay to avoid hitting the rate limit
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo', // Updated to the latest model
                messages: [
                    { role: 'system', content: 'You are an AI assistant specializing in university staff guidelines and knowledge.' },
                    { role: 'user', content: input },
                ],
                max_tokens: 150, // Adjust max tokens to optimize API usage
                temperature: 0.7,
            });

            // Return the AI's response
            return response.choices?.[0]?.message?.content?.trim() || "I'm sorry, I couldn't process your request.";
        } catch (error: any) {
            console.error('OpenAI API error:', error.message || error);
            if (error.message.includes('429')) {
                return "Rate limit exceeded. Please wait a moment before trying again.";
            }
            return "Sorry, I encountered an issue processing your request.";
        }
    },
};
