import Imap from "imap";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env") });

function createImapConnection() {
  return new Imap({
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: true,
      secureProtocol: "TLSv1_2_method",
    },
    authTimeout: 30000, // Increase timeout to 30 seconds
    connTimeout: 30000, // Connection timeout
  });
}

async function searchEmails(expectedSubject, maxAttempts = 5) {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection();

    const handleError = (err) => {
      console.error("IMAP connection error:", err);
      try {
        imap.end();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
      reject(err);
    };

    imap.once("error", handleError);

    imap.once("end", () => {
      console.log("IMAP connection ended");
    });

    imap.once("ready", () => {
      console.log("IMAP connection established successfully");
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("Error opening inbox:", err);
          imap.end();
          reject(err);
          return;
        }

        console.log("Inbox opened successfully");

        // Search for unseen emails from the last hour
        const searchCriteria = [
          "UNSEEN",
          ["SUBJECT", expectedSubject],
          ["SINCE", new Date(Date.now() - 3600 * 1000).toISOString()],
        ];

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error("Error searching emails:", err);
            imap.end();
            reject(err);
            return;
          }

          if (!results.length) {
            console.log("No matching emails found");
            imap.end();
            resolve(null);
            return;
          }

          console.log(`Found ${results.length} matching emails`);

          const f = imap.fetch(results, {
            bodies: [""],
            markSeen: true, // Mark as seen after fetching
          });

          f.once("error", (err) => {
            console.error("Fetch error:", err);
            imap.end();
            reject(err);
          });

          f.on("message", (msg, seqno) => {
            console.log(`Processing message #${seqno}`);
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error("Parser error:", err);
                  return;
                }

                const link = extractLinkFromText(parsed.text);
                if (link) {
                  console.log("Found link:", link);
                  imap.end();
                  resolve(link);
                }
              });
            });
          });

          f.once("end", () => {
            console.log("Done fetching all messages");
            imap.end();
            resolve(null);
          });
        });
      });
    });

    try {
      console.log("Attempting to connect to IMAP server...");
      imap.connect();
    } catch (err) {
      handleError(err);
    }
  });
}

function extractLinkFromText(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

export { searchEmails };
