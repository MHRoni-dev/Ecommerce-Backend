## Challenge01:
During the e-commerce project, the system needed to handle dynamic slug updates when a product’s title was changed. This presented a challenge, as we needed to track slug changes historically without breaking existing links to the product.

### Impact:
Without a historical slug-tracking system, customers using old links would face broken URLs, leading to a poor user experience and potential loss of traffic. This issue also affected SEO, as search engines could index outdated URLs.

### Solution:
To address this, we implemented a ProductRedirect model that tracked every time a product's slug changed. This way, if a customer used an outdated slug, we could check the slug history and redirect them to the latest product URL. 

### Trade-offs:
While this solution resolved the slug history issue, it added complexity to the product model and required additional queries during product lookups. However, the trade-off was necessary to ensure a seamless user experience and maintain SEO rankings.

### Lessons Learned:
This challenge reinforced the need to plan for URL stability early in the product lifecycle. In future projects, we will consider such dynamic URL changes from the start to avoid retroactive migrations.



## Challenge02:
Initially, the ProductRedirect model stored only oldSlug and newSlug for tracking slug changes. This approach created two major issues:

-  Multiple Redirects: When a product’s slug was updated multiple times, accessing an old slug would require several redirects (from    the first old slug to the next and so on) to finally reach the current product slug. This led to performance issues and a poor user experience.
-  Data Inconsistency on Deletion: Since slugs were only stored as oldSlug and newSlug, there was no direct association with the product’s ObjectId. As a result, when a product was deleted, there was no way to easily identify and remove all related slug records, leading to orphaned redirect records.

### Impact:
-  User Experience: Multiple redirects caused unnecessary delays, negatively impacting user experience and potentially affecting SEO due to the chain of HTTP redirects.
-  Performance: Each additional redirect added overhead, increasing response time and server load.
-  Data Integrity: Inability to link slugs to a specific product caused data management issues. Without a product reference, orphaned slug records remained in the database, contributing to clutter and potential confusion when products were deleted.

### Solution:
To resolve both the multiple redirect issue and the deletion problem, the ProductRedirect model was refactored to establish a direct relationship between slugs and the product's ObjectId. Instead of tracking oldSlug and newSlug, the model now stores only the slug and its associated ObjectId. This allows for:

- Single Redirect: When a request is made with an outdated slug, the system uses the ObjectId associated with that slug to immediately fetch the product. This eliminates the need for multiple redirects.
- Efficient Data Deletion: When a product is deleted, all slug records associated with the product's ObjectId can be easily identified and removed in one step, ensuring data consistency and no orphaned records.

### Implementation Steps:
- Update the ProductRedirect model to store only the slug and its associated ObjectId.
- Redirect Logic: When a request is made with a slug, the system checks if that slug is outdated by referencing the ObjectId in ProductRedirect and then retrieves the current product without requiring multiple redirects.
- Product Deletion: When deleting a product, all ProductRedirect records with the associated ObjectId are removed, ensuring no orphaned records remain in the database.

### Trade-offs:
This solution adds a requirement to always use the product’s ObjectId in slug management, but it simplifies both the redirection and deletion processes. It improves user experience by eliminating multiple redirects and enhances database integrity by ensuring that all relevant slug records are cleaned up when a product is deleted.

### Lessons Learned:
This challenge underscored the importance of designing data models with long-term flexibility in mind, especially in projects where URLs (slugs) may change over time. By tying slugs directly to the product's ObjectId, we solved multiple issues at once, ensuring better performance, simpler redirect handling, and cleaner data management during product deletion.