# Auto Login
Easy and quick auto login functionality.

## Features
* Saves the username and password in the local storage of a device or browser and lets you login using those attributes the next time you open the application.
* Login microflow for pre-login logic
* Offline functionality

## Dependencies
Mendix 7.15

## Usage
The widget comes in two parts. The login widget and the logout widget

The login widget:
Place the widget in the context of an object that has an username and password attribute. 
Place two textboxes on the page, one for the username input and one for the password input.
Give those textboxes unique classes.
Fill in the required setup fields of the widget

The logout widget:
In order for this autologin widget to work we need the custom logout widget included in this package.
Simple make a new page and place the logout widget in this page. Make your logout button open this page and voila you are done.

See test project in Github for an example

## Issues, suggestions and feature requests
* Known issue: textbox for username doesnt set autocapitalize correctly in some situations.
* Known issue: The Offline login needs some shady stuff (because of a current Mendix bug) where a session needs to be deleted, this might cause issues. Will be fixed when the Mendix bug is fixed.

We are actively maintaining this widget, please report any issues or suggestion for improvement at https://github.com/GillzBV/Autologin

## Development
To contribute, fork and clone.

    > git clone https://github.com/GillzBV/Autologin