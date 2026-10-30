import { createTestLogger } from "../../logging/logger";
import { test } from "@playwright/test";
import { ElementHelper } from "../../utils/ElementHelper";

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    // Locators
    this.locators = {
      loginBtn: "(//button[contains(.,'Login')])[2]",
      continueWithEmailBtn: "//button[contains(.,'Continue with Email')]",
      emailAddressInput: "//input[@id='email']",
      passwordInput: "//input[@id='password']",
      submitBtn: "//button[@type='submit']",
    };
  }

  async login() {
    try {
      const {
        loginBtn,
        continueWithEmailBtn,
        emailAddressInput,
        passwordInput,
        submitBtn,
      } = this.locators;

      await this.elementHelper.clickElement(loginBtn, 'Login button');
      await this.elementHelper.clickElement(continueWithEmailBtn, 'Continue with Email button');

      await this.elementHelper.fillInput(emailAddressInput, process.env.LOGIN_EMAIL, 'Email input');
      await this.elementHelper.fillInput(passwordInput, process.env.LOGIN_PASSWORD, 'Password input');

      await this.elementHelper.clickElement(submitBtn, 'Submit button');
    } catch (error) {
      this.logger.error(
        "Error during login:",
        error.message || "Unknown error"
      );
      throw error;
    }
  }
}
