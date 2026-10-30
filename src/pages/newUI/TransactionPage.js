import { createTestLogger } from "../../logging/logger.js";
import { expect, test } from "@playwright/test";
import { default as config } from "../../../playwright.config.js";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers.js";
import { fetchEmails } from "../../utils/emailFetcher.js";
import { ElementHelper } from "../../utils/ElementHelper.js";

export class TransactionPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    //locators
    this.locators = {
      getPaidSidebarOption: "//button[@aria-label='Get Paid']",
      transactionSidebarOption: "(//button[contains(.,'Transactions')])[2]",
      createTransactionBtn: "//button[.='+ Create Transaction']",
      transactionPriceInput: "//input[@name='chargeAmount']",
      customerDropdown: "//input[@placeholder='Search or select a customer']",
      customerSelectDropdown: "(//ul/li[@role='option'])[1]",
      paymentMethodManualRadioBtn: "//input[@value='manual']",
      paymentMethodSavedCardRadioBtn: "//input[@value='savedCard']",
      stripeIframe:
        "(//iframe[starts-with(@name, '__privateStripeFrame')][1])[1]",
      cardNum: "//input[@name='cardnumber']",
      expDate: "//input[@name='exp-date']",
      cardCVC: "//input[@name='cvc']",
      transactionChargeAmount: "//button[contains(.,'Send Total Charge:')]",
      confirmYesBtn: "//button[.='Yes']",
      transactionAmount: `//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')]`,
      selectProductTab: "//button[.='Select Product']",
      productDropdown: "//input[@placeholder='Product/Service']",
      productSelectDropdown: "(//ul/li[@role='option'])[1]",
    };
  }

  async navigateToTransaction() {
    try {
      const { getPaidSidebarOption, transactionSidebarOption } = this.locators;
      await this.elementHelper.clickElement(
        getPaidSidebarOption,
        "Get Paid sidebar option"
      );
      await this.elementHelper.clickElement(
        transactionSidebarOption,
        "Transaction sidebar option"
      );
    } catch (error) {
      this.logger.error("Error navigating to the Transaction module", error);
      expect(this.page).toBeFalsy();
    }
  }

  async createTransactionWithCustomAmount() {
    try {
      const {
        createTransactionBtn,
        customerDropdown,
        customerSelectDropdown,
        transactionPriceInput,
        paymentMethodManualRadioBtn,
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        transactionChargeAmount,
        confirmYesBtn,
        transactionAmount,
        paymentMethodSavedCardRadioBtn,
      } = this.locators;

      await this.elementHelper.clickElement(
        createTransactionBtn,
        "Create Transaction button"
      );
      expect(this.page).toHaveURL(
        `${config.use.baseURL}/payments/create?mode=transaction`
      );

      //Enter Transaction Price
      await this.elementHelper.fillInput(
        transactionPriceInput,
        GenerateRandomNumbers(2) + "." + GenerateRandomNumbers(2),
        "Transaction price input"
      );

      //Select Customer
      await this.elementHelper.clickElement(
        customerDropdown,
        "Customer dropdown"
      );
      await this.elementHelper.clickElement(
        customerSelectDropdown,
        "Customer select option"
      );
      this.logger.info("Customer selected successfully in Invoice page.");

      //select payment method
      const isChecked = await this.elementHelper.isChecked(
        paymentMethodManualRadioBtn,
        "Manual payment method radio"
      );
      console.log(isChecked);

      if (isChecked) {
        await this.elementHelper.clickElement(
          paymentMethodManualRadioBtn,
          "Manual payment method radio"
        );
        this.logger.info(
          "Manual Payment method selected successfully in Invoice page."
        );

        //Switch to the iframe
        const cardDetailsIframe = await this.elementHelper.waitForElement(
          stripeIframe,
          "Stripe iframe"
        );
        const frame = await cardDetailsIframe.contentFrame();

        // Now interact with elements inside the iframe
        await frame.locator(cardNum).fill(process.env.CARD_NUMBER);
        await frame.locator(expDate).fill(process.env.CARD_EXP_DATE);
        await frame.locator(cardCVC).fill(process.env.CARD_CVC);
        this.logger.info("Successfully entered card details on Stripe iframe.");

        this.logger.info(
          "Payment method selected successfully in Invoice page."
        );
      }

      const transactionAmountElement = await this.elementHelper.waitForElement(
        transactionAmount,
        "Transaction amount"
      );
      const actualTransactionAmount =
        await transactionAmountElement.textContent();
      console.log(actualTransactionAmount);

      await this.elementHelper.clickElement(
        paymentMethodSavedCardRadioBtn,
        "Saved card payment method radio"
      );
      await this.elementHelper.clickElement(
        transactionChargeAmount,
        "Transaction charge amount button"
      );
      await this.elementHelper.clickElement(
        confirmYesBtn,
        "Confirm Yes button"
      );
      this.logger.info("Successfully pay the transaction.");

      //Check email is sent or not
      const EXPECTED_SUBJECT = `Receipt from ${process.env.BUSINESS_NAME}`;

      console.log("Fetching emails...");
      const link = await fetchEmails(EXPECTED_SUBJECT);

      if (link) {
        this.logger.info("Email found successfully.");
        expect(this.page).toBeTruthy();
      }
    } catch (error) {
      this.logger.error(
        "Error for Creating Transaction with Custom Amount",
        error
      );
      expect(this.page).toBeFalsy();
    }
  }

  async createTransactionWithSelectProduct() {
    try {
      const {
        createTransactionBtn,
        selectProductTab,
        productDropdown,
        productSelectDropdown,
        customerDropdown,
        customerSelectDropdown,
        paymentMethodManualRadioBtn,
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        transactionAmount,
        paymentMethodSavedCardRadioBtn,
        confirmYesBtn,
        transactionChargeAmount,
      } = this.locators;

      await this.elementHelper.clickElement(
        createTransactionBtn,
        "Create Transaction button"
      );
      expect(this.page).toHaveURL(
        `${config.use.baseURL}/payments/create?mode=transaction`
      );

      await this.elementHelper.clickElement(
        selectProductTab,
        "Select Product tab"
      );
      this.logger.info("Successfully clicked on Select Product tab.");

      //Select Product
      await this.elementHelper.clickElement(
        productDropdown,
        "Product dropdown"
      );
      await this.elementHelper.clickElement(
        productSelectDropdown,
        "Product select option"
      );
      this.logger.info("Product selected successfully in Invoice page.");

      //Select Customer
      await this.elementHelper.clickElement(
        customerDropdown,
        "Customer dropdown"
      );
      await this.elementHelper.clickElement(
        customerSelectDropdown,
        "Customer select option"
      );
      this.logger.info("Customer selected successfully in Invoice page.");

      //select payment method
      const isChecked = await this.elementHelper.isChecked(
        paymentMethodManualRadioBtn,
        "Manual payment method radio"
      );
      console.log(isChecked);

      if (isChecked) {
        await this.elementHelper.clickElement(
          paymentMethodManualRadioBtn,
          "Manual payment method radio"
        );
        this.logger.info(
          "Manual Payment method selected successfully in Invoice page."
        );

        //Switch to the iframe
        const cardDetailsIframe = await this.elementHelper.waitForElement(
          stripeIframe,
          "Stripe iframe"
        );
        const frame = await cardDetailsIframe.contentFrame();

        // Now interact with elements inside the iframe
        await frame.locator(cardNum).fill(process.env.CARD_NUMBER);
        await frame.locator(expDate).fill(process.env.CARD_EXP_DATE);
        await frame.locator(cardCVC).fill(process.env.CARD_CVC);
        this.logger.info("Successfully entered card details on Stripe iframe.");

        this.logger.info(
          "Payment method selected successfully in Invoice page."
        );
      }

      const transactionAmountElement = await this.elementHelper.waitForElement(
        transactionAmount,
        "Transaction amount"
      );
      const actualTransactionAmount =
        await transactionAmountElement.textContent();
      console.log(actualTransactionAmount);

      await this.elementHelper.clickElement(
        paymentMethodSavedCardRadioBtn,
        "Saved card payment method radio"
      );
      this.logger.info(
        "Payment method selected successfully in transaction page."
      );

      await this.elementHelper.clickElement(
        transactionChargeAmount,
        "Transaction charge amount button"
      );
      await this.elementHelper.clickElement(
        confirmYesBtn,
        "Confirm Yes button"
      );
      this.logger.info("Successfully pay the transaction.");

      //Check email is sent or not
      const EXPECTED_SUBJECT = `Receipt from ${process.env.COMPANY_NAME}`;

      console.log("Fetching emails...");
      const link = await fetchEmails(EXPECTED_SUBJECT);

      if (link) {
        this.logger.info("Email found successfully.");
        expect(this.page).toBeTruthy();
      }
    } catch (error) {
      this.logger.error(
        "Error for Creating Transaction with Select Product",
        error
      );
      expect(this.page).toBeFalsy();
    }
  }
}
