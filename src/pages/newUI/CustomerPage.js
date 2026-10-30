import { generateRandomString } from "../../utils/GenerateRandomString.js";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers.js";
import { createTestLogger } from "../../logging/logger.js";
import { test, expect } from "@playwright/test";
import { ElementHelper } from "../../utils/ElementHelper.js";

export class CustomerPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    // Locators
    this.locators = {
      manageSidebarOption: "//button[@aria-label='Manage']",
      customersSidebarOption: "(//button[contains(.,'Customers')])[2]",
      addCustomerBtn: "//button[contains(.,'+ Add Customer')]",
      fullNameInput: "//input[@id='fullName']",
      displayNameInput: "//input[@id='displayName']",
      cusEmailAddressInput: "//input[@id='email']",
      phoneNumberInput: "//input[@id='phoneNumber']",
      addCategoryIcon:
        "//input[@placeholder='Find or create category']/following-sibling::div/button",
      categoryInput: "//input[@id='categoryName']",
      addCategoryBtn: "//button[contains(.,'Add Category')]",
      businessNameInput: "//input[@id='businessName']",
      billingAddressInput: "//input[@id='address.auto_complete_address']",
      addBillingAddressDropdown: "//div[@class='pac-item']",
      addCustomerSubmitBtn: "//button[.='Add Customer']",
    };
  }

  async navigateToCustomers() {
    try {
      const { manageSidebarOption, customersSidebarOption } = this.locators;
      await this.elementHelper.clickElement(
        manageSidebarOption,
        "Manage sidebar option"
      );
      await this.elementHelper.clickElement(
        customersSidebarOption,
        "Customers sidebar option"
      );
    } catch (error) {
      this.logger.error("Error navigating to the customer module", error);
      throw error;
    }
  }

  async addCustomer() {
    try {
      const {
        addCustomerBtn,
        fullNameInput,
        displayNameInput,
        cusEmailAddressInput,
        phoneNumberInput,
        addCategoryIcon,
        categoryInput,
        addCategoryBtn,
        businessNameInput,
        billingAddressInput,
        addBillingAddressDropdown,
        addCustomerSubmitBtn,
      } = this.locators;

      // Click Add Customer button
      await this.elementHelper.clickElement(
        addCustomerBtn,
        "Add Customer button"
      );

      // Generate and fill Full Name
      const fullName = `${generateRandomString(5)} ${generateRandomString(5)}`;
      await this.elementHelper.fillInput(
        fullNameInput,
        fullName,
        "Full Name input"
      );

      // Verify Display Name
      const displayNameElement = await this.elementHelper.waitForElement(
        displayNameInput,
        "Display Name input"
      );
      await expect(displayNameElement).toHaveValue(fullName);
      this.logger.info("Display name matches full name");

      // Fill Email Address
      const cusEmailAddress = `qapaid+${generateRandomString(5)}@gmail.com`;
      await this.elementHelper.fillInput(
        cusEmailAddressInput,
        cusEmailAddress,
        "Email Address input"
      );

      // Fill Phone Number
      const phoneNumber = `9${GenerateRandomNumbers(9)}`;
      await this.elementHelper.fillInput(
        phoneNumberInput,
        phoneNumber,
        "Phone Number input"
      );

      // Add Customer Category
      await this.elementHelper.clickElement(
        addCategoryIcon,
        "Add Category icon"
      );
      try {
        await this.elementHelper.fillInput(
          categoryInput,
          generateRandomString(5),
          "Category input"
        );
        await this.elementHelper.clickElement(
          addCategoryBtn,
          "Add Category button"
        );
        this.logger.info("Customer category added successfully");
      } catch (error) {
        this.logger.error("Error adding the category", error);
        throw error;
      }

      await this.page.waitForTimeout(2000);

      // Fill Business Name
      await this.elementHelper.fillInput(
        businessNameInput,
        generateRandomString(5),
        "Business Name input"
      );

      // Add Billing Address
      try {
        await this.elementHelper.fillInput(
          billingAddressInput,
          process.env.BILLING_ADDRESS,
          "Billing Address input"
        );
        await this.elementHelper.clickElement(
          billingAddressInput,
          "Billing Address input"
        );
        await this.elementHelper.clickElement(
          addBillingAddressDropdown,
          "Billing Address dropdown"
        );
        this.logger.info("Customer billing address added successfully");
      } catch (error) {
        this.logger.error("Error selecting the billing address", error);
        throw error;
      }

      // Submit Customer
      await this.elementHelper.clickElement(
        addCustomerSubmitBtn,
        "Add Customer submit button"
      );
    } catch (error) {
      this.logger.error("Error adding the customer", error);
      throw error;
    }
  }
}
