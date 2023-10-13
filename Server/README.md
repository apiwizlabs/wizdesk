
<p align="center">
    <img src="../public/banner.png" alt="Saleswize banner" />
    <br/>
    <br/>
    <b>Wizdesk: Elevate Your CRM Experience with Integration, Efficiency, and Versatility.</b>
</p>


[![Made with Node.js](https://img.shields.io/badge/Node.js->=14-blue?logo=node.js&logoColor=green)](https://nodejs.org "Go to Node.js homepage")
[![Made with React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=#61DAFB)](https://reactjs.org "Go to React homepage")
![GitHub contributors](https://img.shields.io/github/contributors/apiwizlabs/wizdesk)
[![GitHub issues](https://img.shields.io/github/issues/apiwizlabs/wizdesk)](https://github.com/apiwizlabs/wizdesk/issues)
[![GitHub stars](https://img.shields.io/github/stars/apiwizlabs/wizdesk)](https://github.com/apiwizlabs/wizdesk/stargazers)
![GitHub closed issues](https://img.shields.io/github/issues-closed/apiwizlabs/wizdesk)

[![Twitter Follow](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/getapiwiz)
[![Linkedin Follow](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/apiwizio/)

[**APIwiz is proud to make Wizdesk public for Contributions**](https://www.apiwiz.io/)  
Wizdesk is the gateway to seamlessly integrate with Jira, offering a cost-effective open-source alternative with robust issue tracking, efficient communication, and real-time notifications


## 🚀 Getting Started
This is the backend code for [Wizdesk](../), <- Click here to go to UI setup  

### ✨ PreRequisites


1. You will need to setup a private aws bucket.
    - save the access key, secret key, region names and bucket names. these need to be updated in the config and env as given in the following sections.
2. Generate a RSA public and private key pair using this [website](https://cryptotools.net/rsagen).
3. Enable google oauth for your dns/localhost url. here are the [docs](https://support.google.com/cloud/answer/6158849?hl=en)
4. Enable an existing/new gmail to be used with nodemailer to send email alerts and invites. follow this [blog](https://miracleio.me/snippets/use-gmail-with-nodemailer).
    - the password generated after following the blog will be referred to as "generated email password"
5. Generate a string of your choice to be used as a JWT Secret.   
6. Create a mongodb database and replace the url in the place of <mongo_db_url>

Create a .env file and update the following variables accordingly.

```javascript
PRIVATE_KEY: "< place the generated RSA private key here ( refer to the 2nd point ) >"
JWT_SECRET: "< place a randomly generated string (refer to the 5th point above)  >"
AWS_ACCESSKEY: "< place the AWS Access Key ( refer to the 1st point above ) >"
AWS_SECRET_KEY: "< place the AWS Secret Key ( refer to the 1st point above ) >"
GOOGLE_CLIENT_ID: "< place the Google Client Id ( refer to the 3rd point above ) >"

```

Navigate to the `./config.js` and update the following variables accordingly

```javascript
{
    DB_URL: "< place your mongo db url (refer to the 6th point above) >",
    NODE_ENV: "development",
    PORT: 3002,
    
    AWS_BUCKET_NAME: "<place aws bucket name ( refer to the 1st point above )>",
    AWS_REGION: "<place aws bucket region ( refer to the 1st point above )>",
     
    TOKEN_EXPIRY: "24h", // expiry time for login token
    INVITE_EXPIRY: "1h", // invite link expiry
    RESET_EXPIRY: "300000", // reset password link expiry 5mins,
    MAIL_HOST:"smtp.gmail.com",
    MAIL_PORT:"587",
    MAIL_USER:"<mail id used to generate below password>",
    MAIL_PASSWORD:"<generated email password>",
    MAIL_FROM:"<same as MAIL USER>",
    BASE_URL: "http://localhost:3000/"
    ADMIN_EMAIL: "<dummy admin email of your choice>",
    ADMIN_PASSWORD: "<admin email password string of your choice>",
}
```

This should start the server, database and populate dummy data in the database to get started.




## Community Support

For general help using Wizdesk, refer to the below discussion
- [Github](https://github.com/apiwizlabs/wizdesk/discussions) - For bug reports, help, feature requests


## Contributing
All code contributions, including those of people having commit access, must go through a pull request and be approved by a maintaner before being merged. This is to ensure a proper review of all the code.

Kindly read our [Contributing Guide](../CONTRIBUTING.md) to familiarize yourself with Wizdesk's development process, how to suggest bug fixes and improvements, and the steps for building and testing your changes.

## Security

For security issues, kindly email us at security@apiwiz.com instead of posting a public issue on Github

## Follow Us
Join our growing community! Checkout out our official [Blog](https://www.apiwiz.io/resources/blogs). Follow us on [Twitter](https://twitter.com/getapiwiz), [Linkedin](https://www.linkedin.com/company/apiwizio/)


## Thanks to all Contributors 🙏🏼
<a href="https://github.com/apiwizlabs/wizdesk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=apiwizlabs/wizdesk&max=400&columns=20" />
<a>
