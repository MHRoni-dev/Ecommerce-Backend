# Progress

## Done
Product routes :

    - /create
    - /read
    - /read/:slug
    - /update/:slug
    - /delete/:slug


Category routes :

    - /create
    - /read
    - /read/:slug
    - /update/:slug
    - /delete/:slug

User routes:

    - /register
    - /login
    - /resend-verification
    - /verify/:email
    - /login
    - /reset-password
    - /update-password
    - /udpate-profile-image
    - /update-profile-data

Cart routes:

    - /set
    - /get
    - /clear

## ToDo
Product routes:

    - pagination in /read route

Category routes:

    - managing product and category relationship

User routes:

    - /verify/:email => get email form body and make the request put not get and rename route to /verify-email

Order routes:

    - /create
    - /read
    - /read/:orderId 
    - /update/:orderId 
    - /delete/:orderId