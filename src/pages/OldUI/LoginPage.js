export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailAddressInput = "//input[@type='text']";
    this.passwordInput = "//input[@type='password']";
    this.logInBtn = "//button[@type='submit']";
    this.paidPayments = "//h6[normalize-space()='Payments']";
  }

  async login() {
    await this.page
      .locator(this.emailAddressInput)
      .fill(process.env.LOGIN_EMAIL);
    await this.page
      .locator(this.passwordInput)
      .fill(process.env.LOGIN_PASSWORD);
    await this.page.locator(this.logInBtn).click();

    await this.page.waitForSelector(this.paidPayments);

    await this.page.locator(this.paidPayments).click();
  }
  async login() {
    await this.page
      .locator(this.emailAddressInput)
      .fill(process.env.LOGIN_EMAIL);
    await this.page
      .locator(this.passwordInput)
      .fill(process.env.LOGIN_PASSWORD);
    await this.page.locator(this.logInBtn).click();

    await this.page.waitForSelector(this.paidPayments);

    await this.page.locator(this.paidPayments).click();
  }
}
