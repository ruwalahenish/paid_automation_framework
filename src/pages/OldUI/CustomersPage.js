import { generateRandomString } from "../../utils/GenerateRandomString";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";

export class CustomerPage {
  constructor(page) {
    this.page = page;
    this.customerSideLink = "//h6/div/div/p[normalize-space()='Customers']";
    this.addCustomerBtn = "//span[normalize-space()='Add Customer']";
    this.cusFirstName = "//input[@name='first_name']";
    this.cusLastName = "//input[@name='last_name']";
    this.businessName = "//input[@name='business_name']";
    this.cusEmail = "//input[@name='email']";
    this.phoneNum = "//input[@name='phone']";
    this.displayName = "//input[@name='display_name']";
    this.cusNotes = "//textarea[@name='notes']";
    this.billingAddress = "//input[@name='address.addressLine']";
    this.addBillingAddressDrpdown = "//div[@class='pac-item']";
    this.addCustomerFormBtn = "//button[contains(.,'Add Customer')]";
    this.validationToster = "//div[@id='notistack-snackbar']";
  }

  async addCustomer() {
    await this.page.click(this.customerSideLink);
    await this.page.waitForTimeout(2000);
    await this.page.waitForSelector(this.addCustomerBtn);
    await this.page.click(this.addCustomerBtn);
    await this.page.fill(this.cusFirstName, generateRandomString(5));
    await this.page.fill(this.cusLastName, generateRandomString(5));
    await this.page.fill(
      this.businessName,
      generateRandomString(4) + " " + generateRandomString(6)
    );

    //To generate Email Address
    await this.page.fill(
      this.cusEmail,
      "qapaid+" + generateRandomString(5) + "@gmail.com"
    );
    await this.page.fill(this.phoneNum, "9" + GenerateRandomNumbers(9));

    // To verified the display Name
    const fullCusName =
      (await this.page.$eval(this.cusFirstName, (element) => element.value)) +
      " " +
      (await this.page.$eval(this.cusLastName, (element) => element.value));

    if (
      (await this.page.$eval(this.displayName, (element) => element.value)) ===
      fullCusName
    ) {
      console.log("Display Name Match with First Name and Last Name");
    } else {
      console.log("Display Name is not Match with First Name and Last Name");
    }

    await this.page.fill(
      this.cusNotes,
      "Thank you for your continued partnership and trust in our software testing services; we are committed to delivering top-notch quality to meet your expectations."
    );

    //Selecting the Billing Address
    await this.page.fill(this.billingAddress, process.env.BILLING_ADDRESS);
    await this.page.click(this.addBillingAddressDrpdown);

    await this.page.waitForTimeout(2000);

    await this.page.click(this.addCustomerFormBtn);
    await this.page.waitForTimeout(2000);

    //To verify tha validation message displaying or not
    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Customer added successfully"
    );
  }
};
