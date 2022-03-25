# LiveZilla Server

LiveZilla is a help desk software that offers a help desk solution for small companies to large businesses. The platform allows you to connect with customers and potential clients. LiveZilla has an automated chat invite feature that visitors can easily see. The system then enables you to send and receive attachments, such as pictures, videos, and documents, allowing you to encourage visitors to avail of your products or services. The software also sends you notifications in cases of problems, as well as reports. LiveZilla's knowledge base helps you in creating email prompts and queries that convert visitors to clients. The customizable system enables you to match LiveZilla's automated chatbox to your company's theme. You can also decide where to put the chatbox so it will not interfere with other aspects of your website. LiveZilla's location and transcript reports help you monitor your agents and visitors.


<details class="details-reset border rounded-2" open="">
  <summary class="px-3 py-2">
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-device-camera-video">
    <path fill-rule="evenodd" d="M16 3.75a.75.75 0 00-1.136-.643L11 5.425V4.75A1.75 1.75 0 009.25 3h-7.5A1.75 1.75 0 000 4.75v6.5C0 12.216.784 13 1.75 13h7.5A1.75 1.75 0 0011 11.25v-.675l3.864 2.318A.75.75 0 0016 12.25v-8.5zm-5 5.075l3.5 2.1v-5.85l-3.5 2.1v1.65zM9.5 6.75v-2a.25.25 0 00-.25-.25h-7.5a.25.25 0 00-.25.25v6.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-4.5z"></path>
</svg>
    <span aria-label="Video description LiveZilla.-.The.Customer.Support.Software.that.is.all.yours.mp4" class="m-1">LiveZilla.-.The.Customer.Support.Software.that.is.all.yours.mp4</span>
    <span class="dropdown-caret"></span>
  </summary>

  <video src="https://user-images.githubusercontent.com/61565955/159961303-094d75c3-7802-404d-8d01-6d760d2b833e.mp4" data-canonical-src="https://user-images.githubusercontent.com/61565955/159961303-094d75c3-7802-404d-8d01-6d760d2b833e.mp4" controls="controls" muted="muted" class="d-block rounded-bottom-2 border-top width-fit" style="max-height:640px;">

  </video>
</details>


# LiveZilla features
- Chats
- Ticket Management
- Employee Management
- Visitor Tracking
- Reports
- Social Media Accounts Management
- Knowledge Base

# LiveZilla Benefits
![LiveZilla Dashboard](https://user-images.githubusercontent.com/61565955/159961795-ebb6475d-68b9-469f-bfee-eb5391593860.png)

The main benefits of LiveZilla are improved customer relations, easy use and installation, and detailed ticket reports.

## Improved customer relations

LiveZillais a help desk software that specializes in giving solutions to manual chat and email responses. It allows your agents and bots to answer within seconds after customers send their queries. This process is made possible by the system’s automated response feature. Your agents can also use customized shortcuts to answer frequently asked questions (FAQs). LiveZilla inputs this unique code to the system which allows your agents to answer FAQs even without typing. 

This software integrates Google Translate into its system. With this integration, the system can detect over 70 languages. This way, you have increased chances of gaining customers from different parts of the world. It also reduces the need for foreign customer support representatives.

## Easy use and installation

Livezilla provides you with a step-by-step guide of the platform’s dashboard, chatbox and, integrations. Within 15 minutes, you and your agents can start using the software. Lastly, LiveZilla integrates with any website so that you can use it for an online shop, blog, or company website.

## Detailed ticket reports

LiveZilla stores your business’ chat and email transcripts to its database. This feature allows you to evaluate your agents’ performances. The platform also supplies you with daily, monthly, and yearly reports of customer engagements. The overview even shows the location of your visitors. LiveZilla enables you to review marketing campaigns’ results in every country. You can then focus on creating more competitive advertisements in countries that you have few visitors.

# Technical Specifications
## Devices Supported
- Web-based
- iOS
- Android
- Desktop

# LiveZilla Integrations

- Google Translate
- Data API
- Widget API
- Chat BOT API

# Install LiveZilla on Linux
1. Login to server using SSH
2. Go to document root of the domain which you need to install LiveZilla.

```
#cd /home/user/public_html
```
3. Download LiveZilla Server


```
#wget https://github.com/Maher-Amara/livezilla-server/archive/refs/heads/main.zip
```
4. Unzip the file “main.zip”.

```
#unzip main.zip
```
5. Now open your web browser and enter http://yourdomainname/livezilla
6. Before installing LiveZilla you need to create database for LiveZilla.

```
#mysql

>create database livezilla;

>create ‘user_livezilla’@’localhost’;

>set password for ‘user_livezilla’@’localhost’=password(“password”);

>grant all privileges on livezilla.* to user_livezilla@localhost identified by ‘password’;
```
7. You will get below window and you can install LiveZilla from here.
![install-LiveZilla1](https://user-images.githubusercontent.com/61565955/159965070-7a7294bf-e7ca-449c-8fd4-98ebb4d8fcc1.png)
