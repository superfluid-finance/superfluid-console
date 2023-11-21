import { Given, Then } from "cypress-cucumber-preprocessor/steps";
import { ProtocolPage } from "../../pageObjects/pages/ProtocolPage";
import {CommonElements} from "../../pageObjects/components/CommonElements";

Then("User switches network for {string}", (network) => {
  ProtocolPage.switchNetwork(network);
});

Then(
  "General protocol information is showing correct data for {string}",
  (network) => {
    ProtocolPage.validateGovernanceParameters(network);
    ProtocolPage.validateContractAddresses(network);
  }
);

Given("User clicks on the protocol button", () => {
  ProtocolPage.clickProtocolButton();
});

Given(/^User toggles the test network "([^"]*)" in settings$/, (slugName) => {
  CommonElements.openSettingsMenu()
  CommonElements.toggleTestnetBySlug(slugName)
  CommonElements.closeSettingsMenu()
});
