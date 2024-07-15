import axios from "axios";
import { bot } from "../app.js";
import helper from "../utils/helper-base.js";

class Vpay {
  constructor() {
    this.secretKey = process.env.VPAY_SECRETKEY;
    this.publicKey = process.env.VPAY_PUBLICKEY;
    this.baseUrl = "https://services2.vpay.africa";
    this.button = `[[{ text: "MESSAGE CUSTOMER CARE", url: process.env.ADMIN_LINK }]]`;
  }

  async makeRequest(method, url, headers, data, user_id) {
    try {
      const options = {
        baseURL: this.baseUrl,
        url,
        method,
        headers,
        data,
      };
      const response = await axios(options);
      return response.data;
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      return await helper.sendButtons(
        bot,
        user_id,
        `<code>Error generating Account Number.\nKindly Contact the Customer Care.</code>`,
        this.buttons
      );
    }
  }

  async genToken(user_id) {
    try {
      let path = "/api/service/v1/query/merchant/login";
      const headers = {
        "Content-Type": "application/json",
        publicKey: this.publicKey,
      };
      const body = {
        username: process.env.VPAY_USERNAME,
        password: process.env.VPAY_PASSWORD,
      };
      const data = await this.makeRequest("POST", path, headers, body, user_id);
      return data.token;
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      return await helper.sendButtons(
        bot,
        user_id,
        `<code>Error generating Account Number.\nKindly Contact the Customer Care.</code>`,
        this.buttons
      );
    }
  }

  async reserveAccount(requestBody, accessToken, user_id) {
    try {
      let path = "/api/service/v1/query/customer/add";

      let headers = {
        "Content-Type": "application/json",
        publicKey: this.publicKey,
        "b-access-token": accessToken,
      };
      const data = await this.makeRequest(
        "POST",
        path,
        headers,
        requestBody,
        user_id
      );
      return data;
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      return await helper.sendButtons(
        bot,
        user_id,
        `<code>Error generating Account Number.\nKindly Contact the Customer Care.</code>`,
        this.buttons
      );
    }
  }
  async getUser(id, accessToken, user_id) {
    try {
      let path = `/api/service/v1/query/customer/${id}/show`;

      let headers = {
        "Content-Type": "application/json",
        publicKey: this.publicKey,
        "b-access-token": accessToken,
      };
      const data = await this.makeRequest(
        "GET",
        path,
        headers,
        undefined,
        user_id
      );
      return data;
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      return await helper.sendButtons(
        bot,
        user_id,
        `<code>Error generating Account Number.\nKindly Contact the Customer Care.</code>`,
        this.buttons
      );
    }
  }

  async updateUser(body, accessToken, user_id) {
    try {
      let path = `/api/service/v1/query/customer/otherbanks/virtualaccount/update`;

      let headers = {
        "Content-Type": "application/json",
        publicKey: this.publicKey,
        "b-access-token": accessToken,
      };
      const data = await this.makeRequest("POST", path, headers, body, user_id);
      return data;
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      return await helper.sendButtons(
        bot,
        user_id,
        `<code>Error Updating Account Number.\nKindly Contact the Customer Care.</code>`,
        this.buttons
      );
    }
  }
}

export default Vpay;
