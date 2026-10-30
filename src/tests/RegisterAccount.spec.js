import { expect, test } from "@playwright/test";
import { fetchEmails } from "../utils/emailFetcher.js";
import { createTestLogger } from "../logging/logger.js";
import * as allure from "allure-js-commons";

import { SignupPage } from "../pages/SignupPage.js";

test("Register Account", async ({ page, baseURL }) => {
  const logger = createTestLogger(test.info().file);

  await allure.displayName("Register Flow Testing");
  await allure.severity("Critical");

  try {
    // Navigate to the Register Page
    await page.goto(`${baseURL}/auth?type=signup`);
    logger.info("Navigated to the Register page.");

    // Signup Module
    const signup = new SignupPage(page);
    await signup.registerAccount();
    logger.info("Account registration initiated.");

    //Fetch Email
    console.log("Fetching verification email...");
    const EXPECTED_SUBJECT = "[Action Required] Verify Your Email";

    // Pass the page object to fetchEmails to handle link opening
    const link = await fetchEmails(EXPECTED_SUBJECT);

    if (link) {
      console.log("Verification link opened successfully");

      await page.goto(link);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle");

      // Wait for redirection to onboard page
      await expect(page).toHaveURL(new RegExp(`${baseURL}/onboard`), {
        timeout: 50000,
      });

      logger.info("Successfully verified email and redirected to onboard page");
    } else {
      console.log("No verification email found.");
      throw new Error("Verification email not received");
    }
  } catch (error) {
    logger.error("Error performing Register Account test", error);
    throw error;
  }
});
