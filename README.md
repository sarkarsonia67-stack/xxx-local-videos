# 18+ Video Platform Starter

A legal/compliance-oriented starter for an age-gated user-uploaded video website.

## Included
- 18+ age confirmation gate
- User registration/login/logout
- Video upload with title, description and category
- Pending moderation workflow
- Public video listing and watch page
- Search
- User dashboard
- Admin dashboard
- Admin approve/reject/delete
- Report video endpoint/UI
- SQLite database
- Local video storage
- Basic security headers and upload validation

## Important
This is a starter project, not a production deployment. Before accepting real uploads:
1. Verify every uploader is legally permitted to upload the content.
2. Require appropriate consent/rights documentation and a moderation process.
3. Block illegal/non-consensual content and minors.
4. Add robust CSAM detection/reporting procedures, abuse handling, takedown workflow, audit logs and jurisdiction-specific compliance.
5. Put videos behind object storage/CDN in production rather than local disk.
6. Use HTTPS, a strong session secret, rate limiting, malware scanning and backups.
7. Review Indian and any target-country laws and payment/ad-network rules with a qualified professional.

## Run
Node.js 20+ recommended.

```bash
npm install
npm start
```

Open http://localhost:3000

Default admin:
- Email: admin@example.com
- Password: ChangeMe123!

Change the default admin password before deployment.
