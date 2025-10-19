import Resolver from '@forge/resolver';
import { analyzePrompt } from './geminiClient.js';

const resolver = new Resolver();


resolver.define('getText', (req) => {
  console.log(req);
  return 'Different response';
});

resolver.define('sendData', async (req) => {
  console.log('Data received:', req);
  return await analyzePrompt({
    userPrompt: req.payload.query,
    fileText: `"Key","Summary","Description","Issue Type","Status","Assignee","Reporter","Created","Updated"
"KAN-18","Create CI pipeline for app","Add build/lint/test steps with caching.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:44.629-0700","2025-10-18T15:36:44.677-0700"
"KAN-17","Write unit tests for auth","Add tests for signup/login/refresh token flows.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:44.256-0700","2025-10-18T15:36:44.324-0700"
"KAN-16","Chart not rendering in Safari","Investigate canvas initialization issue on Safari.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:43.861-0700","2025-10-18T15:36:43.929-0700"
"KAN-15","Fix login redirect loop","Users stuck after invalid login—add guard and tests.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:43.495-0700","2025-10-18T15:36:43.552-0700"
"KAN-14","Implement backend endpoint","Expose /api/metrics?range=30d with pagination.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:43.128-0700","2025-10-18T15:36:43.181-0700"
"KAN-13","Integrate chart library","Render KPIs with a charting library and pagination.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:42.784-0700","2025-10-18T15:36:42.836-0700"
"KAN-12","Design dashboard layout","Create Figma layout for KPI widgets and filters.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:42.424-0700","2025-10-18T15:36:42.490-0700"
"KAN-11","Connect user service to database","Wire up ORM and connection pool to PostgreSQL.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:42.051-0700","2025-10-18T15:36:42.103-0700"
"KAN-10","Add 2FA support","Implement email-based OTP as a second factor.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:41.689-0700","2025-10-18T15:36:41.740-0700"
"KAN-9","Login page redesign","Redesign login flow with cleaner UI and error states.","Task","To Do","","Alexander Huynh","2025-10-18T15:36:41.146-0700","2025-10-18T15:36:41.250-0700"
"KAN-8","Sample Software Development Issue","This is a sample issue created for demonstration purposes. It represents a generic software development task, such as implementing a new feature, fixing a bug, or improving code quality. Please update or assign as needed.","Epic","To Do","","Alexander Huynh","2025-10-18T13:46:29.332-0700","2025-10-18T13:46:29.413-0700"
"KAN-7","TEST ISSUE","This is a test issue created as requested.","Task","To Do","","Shamil","2025-10-18T13:23:42.357-0700","2025-10-18T13:23:42.434-0700"
"KAN-6","New issue in project KAN","User Story:

As a user, I want to be able to reset my password so that I can regain access to my account if I forget it.

Acceptance Criteria:


	A “Forgot Password” link is available on the login page.
	Clicking the link prompts the user to enter their registered email address.
	The system sends a password reset email to the user.
	The user can set a new password through the reset link.
	The new password takes effect immediately.

","Epic","To Do","Kwang Ho Yeo (Sebastian)","Shamil","2025-10-18T13:23:41.207-0700","2025-10-18T13:30:25.457-0700"
"KAN-5","set up forge ","","Feature","To Do","","Alexander Huynh","2025-10-17T19:56:50.478-0700","2025-10-18T11:05:06.943-0700"
"KAN-4","issue","","Feature","To Do","","Alexander Huynh","2025-10-17T19:53:59.765-0700","2025-10-18T12:55:56.428-0700"
"KAN-3","Subtask 2.1","","Subtask","In Review","","Alexander Huynh","2025-10-17T19:51:21.935-0700","2025-10-17T19:51:22.429-0700"
"KAN-2","Task 2","","Task","In Progress","","Alexander Huynh","2025-10-17T19:51:20.991-0700","2025-10-17T19:51:21.628-0700"
"KAN-1","Task 1","","Feature","In Progress","","Alexander Huynh","2025-10-17T19:51:20.527-0700","2025-10-17T19:51:21.409-0700"`
  });
});

resolver.define('getTTS', async (req) => {
  console.log('TTS request received:', req.payload.text);
  const text = (req.payload.text || "").trim();
  if (!text) throw new Error("Missing text.");

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.7 },
    }),
  });

  if (!r.ok) throw new Error(await r.text());

  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString("base64"); // Forge must return serializable data
});

export const handler = resolver.getDefinitions();
