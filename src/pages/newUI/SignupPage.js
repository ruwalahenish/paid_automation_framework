import { createTestLogger } from "../../logging/logger";
import { generateRandomString } from "../../utils/GenerateRandomString";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers";
import { expect, test } from "@playwright/test";
import { ElementHelper } from "../../utils/ElementHelper";

export class SignupPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    // Locators
    this.locators = {
      signupWithEmailBtn: "//button[contains(.,'Sign up with Email')]",
      emailAddressInput: "//input[@id='email']",
      passwordInput: "//input[@id='password']",
      confirmPasswordInput: "//input[@id='confirmPassword']",
      nextBtnStep1: "//button[contains(.,'Next')]",
      fullNameInput: "//input[@id='name']",
      phoneNumberInput: "//input[@id='phone']",
      nextBtnStep2: "//button[contains(.,'Next')]",
      confirmationMessage:
        "//p[.='We sent you a magic link, please go and verify your email address.']",
    };
  }

  async registerAccount() {
    try {
      const {
        signupWithEmailBtn,
        emailAddressInput,
        passwordInput,
        confirmPasswordInput,
        nextBtnStep1,
        fullNameInput,
        phoneNumberInput,
        nextBtnStep2,
        confirmationMessage,
      } = this.locators;

      await this.elementHelper.clickElement(signupWithEmailBtn, 'Sign up with Email button');

      // Enter Registration Details (Step-1)
      const randomEmail = `qapaid+${generateRandomString(5)}@gmail.com`;
      await this.elementHelper.fillInput(emailAddressInput, randomEmail, 'Email input');
      await this.elementHelper.fillInput(passwordInput, "Paid123!", 'Password input');
      await this.elementHelper.fillInput(confirmPasswordInput, "Paid123!", 'Confirm Password input');
      await this.elementHelper.clickElement(nextBtnStep1, 'Next button (Step 1)');

      // Enter Registration Details (Step-2)
      const randomFullName = `${generateRandomString(5)} ${generateRandomString(5)}`;
      const randomPhoneNumber = `9${GenerateRandomNumbers(9)}`;
      await this.elementHelper.fillInput(fullNameInput, randomFullName, 'Full Name input');
      await this.elementHelper.fillInput(phoneNumberInput, randomPhoneNumber, 'Phone Number input');
      await this.elementHelper.clickElement(nextBtnStep2, 'Next button (Step 2)');

      // Wait for the confirmation message to appear
      await this.page.waitForLoadState();
      const confirmationElement = await this.elementHelper.waitForElement(confirmationMessage, 'Confirmation message');

      // Verify Confirmation Message
      await expect(confirmationElement).toBeVisible();

      this.logger.info("Account registered successfully!!");
    } catch (error) {
      this.logger.error(
        "Error registering account:",
        error.message || "Unknown error"
      );
      throw error;
    }
  }
}
