import { test, expect } from "@playwright/test";
import { createTestLogger } from "../../logging/logger.js";
import { ElementHelper } from "../../utils/ElementHelper.js";
import { fetchEmails } from "../../utils/emailFetcher.js";
import { default as config } from "../../../playwright.config.js";

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const day = String(tomorrow.getDate()).padStart(2, "0");
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = tomorrow.getFullYear();

  return `${day}/${month}/${year}`;
};

export class SubscriptionPage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    //Locators
    this.locators = {
      getPaidSidebarOption: "//button[@aria-label='Get Paid']",
      subscriptionsSidebarOption: "(//button[contains(.,'Subscriptions')])[2]",
      createSubscriptionBtn: "//button[.='+ Create Subscription']",
      customerDropdown: "//input[@placeholder='Search or select a customer']",
      customerSelectDropdown: "(//ul/li[@role='option'])[1]",
      dueDateInput: "//input[@inputmode='text']",
      productDropdown: "//input[@placeholder='Product/Service']",
      productSelectDropdown: "(//ul/li[@role='option'])[1]",
      automaticPaymentRadioBtn: "//input[@value='charge_automatically']",
      addAPaymentMethodBtn: "//button[.='Add A Payment Method']",
      manualPaymentRadioBtn: "//input[@value='send_invoice']",
      stripeIframe:
        "(//iframe[starts-with(@name, '__privateStripeFrame')][1])[1]",
      cardNum: "//input[@name='cardnumber']",
      expDate: "//input[@name='exp-date']",
      cardCVC: "//input[@name='cvc']",
      saveBtn: "//button[.='Save']",
      editCardDetailsIcon: "//a/button",
      dueDateInput: "//input[@inputmode='text']",
      startSubscriptionBtn: "//button[.='Start Subscription']",
      scheduleSubscriptionBtn: "//button[.='Schedule Start Date']",
      confirmYesBtn: "//button[.='Yes']",
      confirmPayRadioBtn: "//input[@type='checkbox']",
      payInvoiceAmount:
        `(//div/p[starts-with(., '$') and contains(., '${process.env.CURRENCY}')])[2]`,
      payBtn: "//button[contains(.,'Pay')]",
      confirmationMessage: "//div/p[.='Invoice paid successfully']",
      startDueDateDrpDown: "//div[@id='schedule_start_date']",
      startDueDateOnfirst: "//li[.='On the 1st of next month']",
      schduleBtn: "//button[.='Schedule']",
    };
  }

  async navigateToSubscriptions() {
    try {
      const { getPaidSidebarOption, subscriptionsSidebarOption } =
        this.locators;
      await this.elementHelper.clickElement(
        getPaidSidebarOption,
        "Get Paid sidebar option"
      );
      await this.elementHelper.clickElement(
        subscriptionsSidebarOption,
        "Subscriptions sidebar option"
      );
    } catch (error) {
      this.logger.error("Error navigating to the subscriptions module", error);
      expect(this.page).toBeFalsy();
    }
  }

  async createStartSubscription() {
    try {
      const {
        createSubscriptionBtn,
        customerDropdown,
        customerSelectDropdown,
        productDropdown,
        productSelectDropdown,
        automaticPaymentRadioBtn,
        manualPaymentRadioBtn,
        addAPaymentMethodBtn,
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        saveBtn,
        editCardDetailsIcon,
        dueDateInput,
        startSubscriptionBtn,
        confirmYesBtn,
        confirmPayRadioBtn,
        payInvoiceAmount,
        payBtn,
        confirmationMessage,
      } = this.locators;

      await this.elementHelper.clickElement(
        createSubscriptionBtn,
        "Create Subscription"
      );

      //Select Customer
      await this.elementHelper.clickElement(
        customerDropdown,
        "Customer dropdown"
      );
      await this.elementHelper.clickElement(
        customerSelectDropdown,
        "Customer select dropdown"
      );
      this.logger.info("Customer selected successfully in subscription page.");

      const isAutoPaymentSelected = await this.elementHelper.isChecked(
        automaticPaymentRadioBtn,
        "Automatic payment radio button"
      );

      console.log(isAutoPaymentSelected);

      //Check which radio button is selected
      if (isAutoPaymentSelected) {
        console.log("In If payment");
        if (
          await this.elementHelper.isVisible(
            addAPaymentMethodBtn,
            "Add A Payment Method button"
          )
        ) {
          console.log("In Else payment");
          await this.elementHelper.clickElement(
            addAPaymentMethodBtn,
            "Add A Payment Method button"
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
          this.logger.info(
            "Successfully entered card details on Stripe iframe."
          );

          await this.elementHelper.clickElement(saveBtn, "Save button");
          this.logger.info("Card Details added successfully.");
        } else {
          console.log("In else Edit");
          await this.elementHelper.isVisible(
            editCardDetailsIcon,
            "Edit Card Details icon"
          );
        }
      } else {
        if (
          await this.elementHelper.isChecked(
            manualPaymentRadioBtn,
            "Manual payment radio button"
          )
        ) {
          await this.elementHelper.clickElement(
            manualPaymentRadioBtn,
            "Manual payment radio button"
          );

          this.expectedDueDate = getTomorrowDate();
          const dueDateElement = await this.elementHelper.waitForElement(
            dueDateInput,
            "Due date input"
          );
          await expect(dueDateElement).toHaveValue(this.expectedDueDate);
          this.logger.info("Due date is display correct in Invoice page.");
          this.logger.info("Manual payment selected successfully.");
        }
      }

      console.log("Out of the else");

      //Select Product
      await this.elementHelper.clickElement(
        productDropdown,
        "Product dropdown"
      );
      await this.elementHelper.clickElement(
        productSelectDropdown,
        "Product select option"
      );
      this.logger.info("Product selected successfully in subscription page.");

      //Start Subscription
      await this.elementHelper.clickElement(
        startSubscriptionBtn,
        "Start Subscription button"
      );
      this.logger.info("Start Subscription button clicked successfully.");

      await this.elementHelper.clickElement(
        confirmYesBtn,
        "Confirm Yes button"
      );
      this.logger.info("Confirm Yes button clicked successfully.");

      if (isAutoPaymentSelected) {
        //Check email is sent or not
        const EXPECTED_SUBJECT = `Receipt from ${process.env.BUSINESS_NAME}`;

        console.log("Fetching emails...");
        const link = await fetchEmails(EXPECTED_SUBJECT);

        if (link) {
          this.logger.info("Email found successfully.");
          expect(this.page).toBeTruthy();
        }
      } else {
        //Check email is sent or not
        const EXPECTED_SUBJECT = `Invoice for Subscription from ${process.env.BUSINESS_NAME}`;
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
          this.logger.info(
            "Successfully opened the subscription link in a new tab."
          );
        } else {
          console.log("No matching email or link found.");
        }

        console.log("Out of the if");
        const newPageHelper = new ElementHelper(this.newPage, this.logger);

        /*
        const payInvoiceAmountElement = await newPageHelper.waitForElement(
          payInvoiceAmount,
          "Pay invoice amount"
        );
        */

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
        expect(isConfirmationMessage).toBe("Invoice paid successfully");
        this.logger.info("Confirmation message is displayed after payment.");

        //Close the new page
        await this.newPage.close();
        this.logger.info("Closed the new page after payment.");
      }
    } catch (error) {
      this.logger.error("Error creating a start subscription", error);
      expect(this.page).toBeFalsy();
    }
  }

  async createSchduleSubscription() {
    try {
      const {
        createSubscriptionBtn,
        customerDropdown,
        customerSelectDropdown,
        productDropdown,
        productSelectDropdown,
        automaticPaymentRadioBtn,
        manualPaymentRadioBtn,
        addAPaymentMethodBtn,
        stripeIframe,
        cardNum,
        expDate,
        cardCVC,
        saveBtn,
        editCardDetailsIcon,
        dueDateInput,
        scheduleSubscriptionBtn,
        confirmYesBtn,
        startDueDateDrpDown,
        startDueDateOnfirst,
        schduleBtn,
      } = this.locators;

      await this.elementHelper.clickElement(
        createSubscriptionBtn,
        "Create Subscription"
      );

      //Select Customer
      await this.elementHelper.clickElement(
        customerDropdown,
        "Customer dropdown"
      );
      await this.elementHelper.clickElement(
        customerSelectDropdown,
        "Customer select dropdown"
      );
      this.logger.info("Customer selected successfully in subscription page.");

      const isAutoPaymentSelected = await this.elementHelper.isChecked(
        automaticPaymentRadioBtn,
        "Automatic payment radio button"
      );

      console.log(isAutoPaymentSelected);

      //Check which radio button is selected
      if (isAutoPaymentSelected) {
        console.log("In If payment");
        if (
          await this.elementHelper.isVisible(
            addAPaymentMethodBtn,
            "Add A Payment Method button"
          )
        ) {
          console.log("In Else payment");
          await this.elementHelper.clickElement(
            addAPaymentMethodBtn,
            "Add A Payment Method button"
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
          this.logger.info(
            "Successfully entered card details on Stripe iframe."
          );

          await this.elementHelper.clickElement(saveBtn, "Save button");
          this.logger.info("Card Details added successfully.");
        } else {
          console.log("In else Edit");
          await this.elementHelper.isVisible(
            editCardDetailsIcon,
            "Edit Card Details icon"
          );
        }
      } else {
        if (
          await this.elementHelper.isChecked(
            manualPaymentRadioBtn,
            "Manual payment radio button"
          )
        ) {
          await this.elementHelper.clickElement(
            manualPaymentRadioBtn,
            "Manual payment radio button"
          );

          this.expectedDueDate = getTomorrowDate();
          const dueDateElement = await this.elementHelper.waitForElement(
            dueDateInput,
            "Due date input"
          );
          await expect(dueDateElement).toHaveValue(this.expectedDueDate);
          this.logger.info("Due date is display correct in Invoice page.");
          this.logger.info("Manual payment selected successfully.");
        }
      }

      console.log("Out of the else");

      //Select Product
      await this.elementHelper.clickElement(
        productDropdown,
        "Product dropdown"
      );
      await this.elementHelper.clickElement(
        productSelectDropdown,
        "Product select option"
      );
      this.logger.info("Product selected successfully in subscription page.");

      //Schedule Subscription
      await this.elementHelper.clickElement(
        scheduleSubscriptionBtn,
        "Schdule Subscription button"
      );
      this.logger.info("Schdule Subscription button clicked successfully.");

      await this.elementHelper.clickElement(
        startDueDateDrpDown,
        "Start Due Date DrpDown"
      );
      this.logger.info("Start Due Date DrpDown clicked successfully.");

      await this.elementHelper.clickElement(
        startDueDateOnfirst,
        "Start Due Date On first"
      );
      this.logger.info("Start Due Date On first clicked successfully.");

      await this.elementHelper.clickElement(schduleBtn, "Schdule button");
      this.logger.info("Schdule button clicked successfully.");

      await this.elementHelper.clickElement(
        confirmYesBtn,
        "Confirm Yes button"
      );
      this.logger.info("Confirm Yes button clicked successfully.");
    } catch (error) {
      this.logger.error("Error creating a schdule subscription", error);
      expect(this.page).toBeFalsy();
    }
  }
}
