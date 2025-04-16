# Kyuto  
**An E-Commerce Platform for VSU-Main Campus Student Organizations**

Kyuto is a modern, scalable e-commerce platform designed specifically for student organizations at Visayas State University (VSU) - Main Campus. Built with **NuxtJS** for a seamless, server-side rendered user experience and powered by **Firebase** for real-time database functionality.

## **Technology Stack**
- **Frontend**: NuxtJS (Vue.js framework) for a responsive and SEO-friendly user interface.
- **Backend**: Firebase (Firestore, Authentication, Storage) for real-time data management and scalability.
- **Hosting**: Vercel for seamless deployment and hosting.

## **Release Notes**
### **KT.010.000 Release Notes**
- **Initial Release**: Core functionalities implemented, including user authentication, inventory management, and basic storefront.
- **Features**:
  - User and organization authentication.
  - Basic product and variation management.
  - Initial setup for online store and product browsing.

### **KT.010.001 Release Notes**
- **Refactored Pages**:
  - **Organization Pages**: Refactored the following pages for improved performance and user experience (The main problem was redundant query calls leading to slow performance):
    - `/products/` – Product listing page.
    - `/products/add` – Add product page.
    - `/orders/` – Order management page.
    - `/dashboard/` – Analytics dashboard.
    - Organization homepage (`/organization/index`).
  - Improved navigation and responsiveness across all organization pages.
- **Added Features**:
  - **Product Filters**: Users can browse for products through a filter tool (Sorting prices, Categories, etc.).
  - **View Organization Store**: Publicly accessible storefronts for each organization.
- **Added Frontend Setups (Mockup) Pages**
  - Admin Features
  - Product Search
  - Dashboard
  - User Profile Settings
  - Organization Profile and Accounts Settings
- **Known Issues**:
  - **Edit Product Page**: When selecting a product to edit, the product’s information does not load immediately. Users must navigate back to the products page and select the product again to view its details.
  - **User Authentication on Refresh**: The browser does not detect the logged-in user immediately after a refresh, causing the page to redirect to the homepage. This issue occurs due to a delay in Firebase Authentication initialization.
  - **Numerical Input Fields**: Numerical input fields (e.g., price) do not accept decimal values. Any decimal input is automatically rounded up to the nearest whole number.
  - Simple analytics features are still under development.
  - G-Cash payment option is still not available.

### **KT.010.002 Release Notes**  
- **Refactored & Fixed**  
  - **Fixed:**  
    - Numerical input fields now accept 2 decimal places.  
    - Edit Product Page loads current values properly.  
  - **Patched Known Issues:**  
    - Redundant queries in Organization Pages (performance boost).  

- **Added Features**  
  - **Commission Rate System:**  
    - Organizations now pay per-item commission (replaces Subscription Plan).  
  - **Search Functionality:**  
    - Added search for store/products pages.  
  - **Organization Profiles:**  
    - Logo upload & public profile editing (Address, Images).  
  - **Backend:** Store page now fully functional.  

- **Known Issues**  
  - Simple analytics still in development.  
  - GCash payment option pending.  
  - Limited admin automation tools (e.g., account tracking).  
 
Important Links:
 - Design Specs: https://github.com/SSKiyan25/kyuto
