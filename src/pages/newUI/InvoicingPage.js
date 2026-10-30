import { expect, test } from "@playwright/test";
import { createTestLogger } from "../../logging/logger.js";
import { default as config } from "../../../playwright.config.js";
import { fetchEmails } from "../../utils/emailFetcher.js";
import { ElementHelper } from "../../utils/ElementHelper.js";

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const day = String(tomorrow.getDate()).padStart(2, "0");
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = tomorrow.getFullYear();

  return `${day}/${month}/${year}`;
};

export class InvoicingPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);
    this.newPage = null;
    this.expectedDueDate = null;
    this.totalInvoiceAmount = null;

    // Locators
    this.locators = {
      getPaidSidebarOption: "//button[@aria-label='Get Paid']",
      invoicingSidebarOption: "(//button[contains(.,'Invoicing')])[2]",
      createInvoiceBtn: "//button[.='+ Create Invoice']",
      customerDropdown: "//input[@placeholder='Search or select a customer']",
      customerSelectDropdown: "(//ul/li[@role='option'])[1]",
      dueDateInput: "//input[@inputmode='text']",
      productDropdown: "//input[@placeholder='Product/Service']",
      productSelectDropdown: "(//ul/li[@role='option'])[1]",
      sendInvoiceBtn: "//button[.='Send Invoice']",
      invoiceAmount: `//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')]`,
      previewInvoiceAmount:
        `(//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')])[2]`,
      previewSendInvoiceBtn: "//button[.='Send Invoice']",
      stripeIframe:
        "(//iframe[starts-with(@name, '__privateStripeFrame')][1])[2]",
      cardNum: "//input[@name='cardnumber']",
      expDate: "//input[@name='exp-date']",
      cardCVC: "//input[@name='cvc']",
      confirmPayRadioBtn: "//input[@type='checkbox']",
      payInvoiceAmount:
        `(//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')])[2]`,
      payBtn: "//button[contains(.,'Pay')]",
      confirmationMessage: "//div/p[.='Invoice paid successfully.']",
    };
  }

  async navigateToInvoicing() {
    try {
      const { getPaidSidebarOption, invoicingSidebarOption } = this.locators;
      await this.elementHelper.clickElement(
        getPaidSidebarOption,
        "Get Paid sidebar option"
      );
      await this.elementHelper.clickElement(
        invoicingSidebarOption,
        "Invoicing sidebar option"
      );
    } catch (error) {
      this.logger.error("Error navigating to the invoicing module", error);
      expect(this.page).toBeFalsy();
    }
  }

  async createInvoice() {
    const {
      createInvoiceBtn,
      customerDropdown,
      customerSelectDropdown,
      productDropdown,
      productSelectDropdown,
      sendInvoiceBtn,
      dueDateInput,
      invoiceAmount,
      previewSendInvoiceBtn,
      previewInvoiceAmount,
    } = this.locators;
    try {
      //navigate to create invoice page
      await this.elementHelper.clickElement(
        createInvoiceBtn,
        "Create Invoice button"
      );
      await this.page.waitForLoadState();
      await expect(this.page).toHaveURL(
        `${config.use.baseURL}/payments/create?mode=invoice`
      );
      this.logger.info("Successfully navigated to Create Invoice page.");

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

      //Check Due date is display correct or not
      this.expectedDueDate = getTomorrowDate();
      const dueDateElement = await this.elementHelper.waitForElement(
        dueDateInput,
        "Due date input"
      );
      await expect(dueDateElement).toHaveValue(this.expectedDueDate);
      this.logger.info("Due date is display correct in Invoice page.");

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

      //Check Invoice amount is display or not
      const invoiceAmountElement = await this.elementHelper.waitForElement(
        invoiceAmount,
        "Invoice amount"
      );
      this.totalInvoiceAmount = await invoiceAmountElement.textContent();
      console.log(
        "Invoice Amount on create invoice page",
        this.totalInvoiceAmount
      );

      //Send Invoice
      await this.elementHelper.clickElement(
        sendInvoiceBtn,
        "Send Invoice button"
      );

      // Wait for the preview amount to be visible
      const previewAmountElement = await this.elementHelper.waitForElement(
        previewInvoiceAmount,
        "Preview invoice amount"
      );
      const previewTotalInvoiceAmount =
        await previewAmountElement.textContent();
      console.log("Invoice Amount on preview page", previewTotalInvoiceAmount);

      expect(this.totalInvoiceAmount).toBe(previewTotalInvoiceAmount);
      this.logger.info("Invoice amount is display correct in Invoice page.");

      await this.elementHelper.clickElement(
        previewSendInvoiceBtn,
        "Preview Send Invoice button"
      );
      this.logger.info("Invoice sent successfully.");
    } catch (error) {
      this.logger.error("Error creating an invoice", error);
      expect(this.page).toBeFalsy();
    }
  }

  async fetchPaymentLink() {
    try {
      //Check email is sent or not
      const EXPECTED_SUBJECT = `Invoice from ${process.env.BUSINESS_NAME}`;
      console.log(EXPECTED_SUBJECT);

      console.log("Fetching emails...");
      const link = await fetchEmails(EXPECTED_SUBJECT);

      if (link) {
        console.log("Opening link in new tab...");
        this.newPage = await this.page.context().newPage();
        await this.newPage.goto(link);
        await this.newPage.waitForLoadState();
        await expect(this.newPage).toHaveURL(
          `${config.use.baseURL}/pay-invoice`
        );
        this.logger.info("Successfully opened the invoice link in a new tab.");
      } else {
        console.log("No matching email or link found.");
      }
    } catch (error) {
      this.logger.error("Error fetching payment link of Invoice", error);
      expect(this.page).toBeFalsy();
    }
  }

  async payInvoice() {
    try {
      const {
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        confirmPayRadioBtn,
        payInvoiceAmount,
        payBtn,
        confirmationMessage,
      } = this.locators;

      // Create a new ElementHelper instance for the new page
      const newPageHelper = new ElementHelper(this.newPage, this.logger);

      //Check Invoice amount is display correct or not
      const payInvoiceAmountElement = await newPageHelper.waitForElement(
        payInvoiceAmount,
        "Pay invoice amount"
      );
      expect(this.totalInvoiceAmount).toBe(
        await payInvoiceAmountElement.textContent()
      );
      this.logger.info(
        "Invoice amount is display correct in Pay Invoice page."
      );

      //Switch to the iframe
      const cardDetailsIframe = await newPageHelper.waitForElement(
        stripeIframe,
        "Stripe iframe"
      );
      const frame = await cardDetailsIframe.contentFrame();

      // Now interact with elements inside the iframe
      await frame.locator(cardNum).fill(process.env.CARD_NUMBER);
      await frame.locator(expDate).fill(process.env.CARD_EXP_DATE);
      await frame.locator(cardCVC).fill(process.env.CARD_CVC);
      this.logger.info("Successfully entered card details on Stripe iframe.");

      //checkbox for confirm payment
      await newPageHelper.clickElement(
        confirmPayRadioBtn,
        "Confirm payment checkbox"
      );

      //click on the pay button
      await newPageHelper.clickElement(payBtn, "Pay button");
      this.logger.info("Successfully clicked on the Pay button.");

      //check that payment is success or not
      const confirmationElement = await newPageHelper.waitForElement(
        confirmationMessage,
        "Confirmation message"
      );
      const isConfirmationMessage = await confirmationElement.textContent();
      expect(isConfirmationMessage).toBe("Invoice paid successfully.");
      this.logger.info("Confirmation message is displayed after payment.");

      //Close the new page
      await this.newPage.close();
      this.logger.info("Closed the new page after payment.");

      // Bring to front
      await this.page.bringToFront();
    } catch (error) {
      this.logger.error("Error for pay the Invoice", error);
      throw error;
    }
  }
}
