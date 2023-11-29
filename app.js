const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

const OpenAI = require("openai");

const bot = new Telegraf(process.env.BOT_TOKEN)


main();



async function main(userQuestion) {
    try {
        const secretKey = process.env.OPENAI_API_KEY;
        const openai = new OpenAI({
            apiKey: secretKey,
        });

        const assistant = await openai.beta.assistants.create({
            name: "Test",
            instructions:
            "You are a marketer. You should create a poster",
            tools: [{ type: "code_interpreter" }],
            model: "gpt-4-1106-preview",
        });

        // Log the first greeting
        console.log("Hello there");

        // Create a thread
        const thread = await openai.beta.threads.create();


        bot.on(message(), async (ctx) => {
        //main(ctx.message.text);
        ctx.reply( await sendRequest(ctx.message.text));
        });

        //bot.hears('hi', (ctx) => ctx.reply('Hey there'))
        bot.launch()

        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'))
        process.once('SIGTERM', () => bot.stop('SIGTERM'))

        async function sendRequest(userQuestion) {     
            
            // Use keepAsking as state for keep asking questions
            
            //const userQuestion = await askQuestion("\nWhat is your question? ");

            // Pass in the user question into the existing thread
            await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: userQuestion,
            });
            
            // Use runs to wait for the assistant response and then retrieve it
            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: assistant.id,
            });
            
            let runStatus = await openai.beta.threads.runs.retrieve(
                thread.id,
                run.id
            );
            
            // Polling mechanism to see if runStatus is completed
            // This should be made more robust.
            while (runStatus.status !== "completed") {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
            }
            
            // Get the last assistant message from the messages array
            const messages = await openai.beta.threads.messages.list(thread.id);

            // Find the last message for the current run
            const lastMessageForRun = messages.data
                .filter(
                (message) => message.run_id === run.id && message.role === "assistant"
                )
                .pop();

            // If an assistant message is found, console.log() it
            if (lastMessageForRun) {
                return lastMessageForRun.content[0].text.value;
                console.log(`${lastMessageForRun.content[0].text.value} \n`);
            } 
        }  
    } catch (error) {
          console.error(error);
        }
    }
      
      
      // Call the main function
      //main();