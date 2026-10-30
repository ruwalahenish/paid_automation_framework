import { searchEmails } from "./gmail-auth.js";

async function fetchEmails(expectedSubject, maxAttempts = 5, page) {
  console.log(`Searching for email with subject: ${expectedSubject}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Attempt ${attempt} of ${maxAttempts}`);

    try {
      const link = await searchEmails(expectedSubject);
      if (link) {
        console.log("Email found with link:", link);

        // Immediately try to open the link when found
        if (page) {
          console.log("Attempting to open link in browser...");
          try {
            // Wait for any ongoing navigations to complete
            try {
              await page.waitForLoadState("networkidle", { timeout: 5000 });
            } catch (e) {
              console.log("Continuing after networkidle timeout");
            }

            // Try to open the link with retries
            let openSuccess = false;
            for (let navAttempt = 1; navAttempt <= 3; navAttempt++) {
              try {
                console.log(`Navigation attempt ${navAttempt} to: ${link}`);
                
                // Close any dialogs that might be present
                try {
                  await page.keyboard.press("Escape");
                } catch (e) {}

                const response = await page.goto(link, {
                  waitUntil: "domcontentloaded",
                  timeout: 60000,
                });

                // Wait for network to be idle after navigation
                await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {
                  console.log("Network didn't reach idle state, but continuing...");
                });

                if (response && response.ok()) {
                  console.log("Successfully opened link in the browser");
                  openSuccess = true;

                  // Additional wait to ensure page is stable
                  await page.waitForTimeout(2000);
                  break;
                }

                console.log(
                  `Navigation response not OK, attempt ${navAttempt}. Status: ${response?.status()}`
                );
                
                if (navAttempt < 3) {
                  await page.waitForTimeout(3000); // Wait longer between retries
                }
              } catch (navError) {
                console.error(
                  `Navigation attempt ${navAttempt} failed:`,
                  navError.message
                );
                if (navAttempt === 3) throw navError;
                await page.waitForTimeout(3000);
              }
            }

            if (!openSuccess) {
              throw new Error("Failed to open link after all attempts");
            }
          } catch (pageError) {
            console.error("Error opening link in browser:", pageError.message);
            throw pageError;
          }
        }

        return link;
      }

      if (attempt < maxAttempts) {
        console.log(
          "Email not found, waiting 5 seconds before next attempt..."
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`Error in attempt ${attempt}:`, error.message);
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log("No matching email found after all attempts.");
  return null;
}

export { fetchEmails };
