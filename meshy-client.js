const API_KEY = "msy_GchB87KBUAxaGLjmhs4HOFfk1W50TtOgwW3E";
const BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d";

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json"
};

async function listTasks() {
  console.log("Fetching Text-to-3D tasks...");
  try {
    const res = await fetch(`${BASE_URL}?page_num=1&page_size=10`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("\nRecent Tasks:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error listing tasks:", err.message);
  }
}

async function getTaskStatus(taskId) {
  try {
    const res = await fetch(`${BASE_URL}/${taskId}`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`Error fetching status for task ${taskId}:`, err.message);
    return null;
  }
}

async function generateModel(prompt, artStyle = "cartoon") {
  console.log(`Submitting Text-to-3D task:\n  Prompt: "${prompt}"\n  Style: "${artStyle}"`);
  
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode: "preview",
        prompt: prompt,
        art_style: artStyle
      })
    });
    
    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(`HTTP error! status: ${res.status}. Details: ${errMsg}`);
    }
    
    const body = await res.json();
    const taskId = body.result;
    
    if (!taskId) {
      throw new Error(`No task ID returned in response: ${JSON.stringify(body)}`);
    }
    
    console.log(`\nTask submitted successfully! ID: ${taskId}`);
    console.log("Polling for status updates (this may take 1-3 minutes)...");
    
    let dots = "";
    while (true) {
      const task = await getTaskStatus(taskId);
      if (!task) {
        console.log("Retrying status check in 10s...");
        await new Promise(r => setTimeout(r, 10000));
        continue;
      }
      
      const status = task.status;
      const progress = task.progress || 0;
      
      process.stdout.write(`\rStatus: ${status} (${progress}%) ${dots}`);
      dots = dots.length >= 3 ? "" : dots + ".";
      
      if (status === "SUCCEEDED") {
        console.log("\n\n🎉 Generation Successful!");
        console.log("Model URLs:");
        console.log(JSON.stringify(task.model_urls, null, 2));
        break;
      } else if (status === "FAILED") {
        console.log(`\n\n❌ Task failed. Error details: ${task.task_error ? JSON.stringify(task.task_error) : 'Unknown error'}`);
        break;
      }
      
      await new Promise(r => setTimeout(r, 5000));
    }
  } catch (err) {
    console.error("Error generating model:", err.message);
  }
}

function showHelp() {
  console.log(`
Meshy AI CLI client
Usage:
  node meshy-client.js list
  node meshy-client.js status <task_id>
  node meshy-client.js generate "<prompt>" [artStyle]

Examples:
  node meshy-client.js generate "a cute yellow 3d duck toy" cartoon
  node meshy-client.js status 019036f0-d5a2-7212-9c17-91a90f1110de
`);
}

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  showHelp();
  process.exit(0);
}

switch (command.toLowerCase()) {
  case 'list':
    listTasks();
    break;
  case 'status':
    if (!args[1]) {
      console.error("Error: Please provide a task ID.");
      process.exit(1);
    }
    getTaskStatus(args[1]).then(task => {
      if (task) console.log(JSON.stringify(task, null, 2));
    });
    break;
  case 'generate':
    if (!args[1]) {
      console.error("Error: Please provide a text prompt.");
      process.exit(1);
    }
    generateModel(args[1], args[2] || "cartoon");
    break;
  default:
    showHelp();
}
