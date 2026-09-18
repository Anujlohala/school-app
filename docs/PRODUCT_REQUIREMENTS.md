# School Friends Dhukuti Tracking Website

## Product Requirements Document

| **Document status** | V1 requirements agreed |
|----|----|
| **Prepared for** | Dhukuti group administrator and implementation team |
| **Product scope** | Private web application for 11 school friends |
| **Current state** | Cycle 1 has 10 completed months and one remaining month |
| **Document date** | 18 September 2026 |

# **Product summary**

The product will replace the group administrator's Google Sheet with a private website that records monthly Dhukuti payments and makes the group's saving fund transparent to all 11 friends. The administrator will record winners and completed payments. Members will use a shared read-only account to view the same balances, pending amounts, winner history, and monthly records.

Version 1 will focus on accurate transaction tracking. It will not select winners, process payments, manage penalties, or record gathering expenses. The first release must also support manual entry of the 10 months already completed in Cycle 1.

# **Document purpose**

This document defines the agreed business rules, user access, screens, calculations, functional requirements, acceptance criteria, and boundaries for Version 1. It is the reference for product design and development.

# **1 Product context**

The group meets once each month, normally on the last Saturday of the Gregorian calendar month. One member is selected through an in-person Chitta process and receives the Dhukuti collected from the other members. The website records the result; it does not conduct the draw.

All member payments are currently sent to the administrator through eSewa, bank transfer, or cash. The administrator checks each payment and records it manually. The website will provide one consistent place for these records and show every authenticated member the same information.

# **2 Product goals**

- Give every friend a clear view of collected and pending monthly payments.

- Calculate each member's required payment from their winner status without spreadsheet formulas.

- Show the actual saving fund balance and its fixed saving, interest, extra contribution, and carried balance components.

- Preserve month-by-month and cycle-by-cycle records, including corrections to completed months.

- Keep monthly administration simple enough for one administrator to maintain reliably.

# **3 Product success indicators**

- The administrator can enter all 10 historical months and reconcile the calculated saving balance with the group's records.

- A monthly payment can be recorded with one status action and one payment method selection.

- Members can identify the current winner, pending members, saving balance, and next meeting date from the dashboard.

- All displayed totals are derived from recorded transactions rather than manually typed summary figures.

- Past months remain editable by the administrator and display when they were last updated.

# **4 Users and permissions**

| **User** | **Account model** | **Permissions** |
|:---|:---|:---|
| Administrator | One separate administrator account | Create and edit cycles, months, winners, schedules, payments, extra contributions, and historical records |
| Members | One username and password shared by all friends | Read-only access to all dashboards, monthly records, saving records, winners, and history |

Both accounts must require authentication. No group information may be available publicly. Because members share one account, changing the member password will affect the entire group.

# **5 Dhukuti business rules**

## **5.1 Cycle rules**

- A cycle contains 11 members and lasts 11 months.

- One member wins once in each cycle.

- The Chitta selection happens outside the website during the friends' gathering.

- The administrator records the selected winner in the relevant month.

- After Month 11, winner eligibility and interest obligations reset for the new cycle.

- The saving fund balance carries forward unless it is used outside Version 1.

## **5.2 Monthly member obligations**

| **Member status** | **Dhukuti** | **Fixed saving** | **Interest** | **Total due** |
|:---|:--:|:--:|:--:|:--:|
| Has not won | रु 2,000 | रु 100 | रु 0 | रु 2,100 |
| Won in an earlier month | रु 2,000 | रु 100 | रु 200 | रु 2,300 |
| Current month's winner | रु 0 | रु 100 | रु 0 | रु 100 |

The current winner does not pay the रु 2,000 Dhukuti contribution in the winning month. The winner begins paying रु 200 interest in the following month and continues through the final month of that cycle.

Payments are not divisible in Version 1. A member sends the full required amount in one payment. When the administrator marks a payment as paid, the website allocates the amount to Dhukuti, fixed saving, and interest according to the member's status.

## **5.3 Monthly payout**

The other 10 members each contribute रु 2,000, so the current winner receives रु 20,000. The website displays the calculated payout and winner but does not require the administrator to upload a transfer receipt or confirm an outgoing transaction.

## **5.4 Saving fund**

The saving fund has four sources: the carried balance from earlier cycles, रु 100 fixed savings from each member every month, रु 200 monthly interest from members who won earlier in the current cycle, and voluntary extra contributions such as birthday gifts.

Only received payments count in the actual saving balance. Pending fixed savings and pending interest appear as outstanding amounts and do not increase the collected balance.

## **5.5 Extra contributions**

An extra contribution is recorded separately from the member's required monthly payment. It includes the contributor, amount, payment method, and an optional reason. All members can see the contributor and reason. Extra contributions increase the saving balance but do not affect the Dhukuti payout, winner status, or future monthly dues.

## **5.6 Late and corrected payments**

If a pending payment is received later, the administrator records it against the original month. The administrator may also correct completed months. A corrected record shows a simple last updated indicator; Version 1 does not require a detailed audit log.

# **6 Financial calculations**

The website must calculate totals from recorded member transactions. Summary values must not be independently editable.

| **Calculation** | **Formula** | **Cycle 1 baseline** |
|:---|:---|:--:|
| Monthly winner payout | 10 members × रु 2,000 | रु 20,000 |
| Fixed saving for 11 months | 11 members × रु 100 × 11 months | रु 12,100 |
| Interest saving for 11 months | रु 200 × (10 + 9 + ... + 1) | रु 11,000 |
| Total baseline saving | Fixed saving + interest saving | रु 23,100 |
| Total Dhukuti distributed | 11 winners × रु 20,000 | रु 220,000 |

## **6.1 Monthly saving formula**

For month m of a cycle, where m ranges from 1 to 11:

- Fixed saving due = 11 × रु 100 = रु 1,100.

- Interest due = (m - 1) × रु 200.

- Baseline saving due for the month = रु 1,100 + interest due.

- Actual saving added = fixed saving received + interest received + extra contributions received.

## **6.2 Expected Cycle 1 progression**

| **Month** | **Fixed saving** | **Interest** | **Baseline added** | **Cumulative baseline** |
|:--:|:--:|:--:|:--:|:--:|
| 1 | रु 1,100 | रु 0 | रु 1,100 | रु 1,100 |
| 2 | रु 1,100 | रु 200 | रु 1,300 | रु 2,400 |
| 3 | रु 1,100 | रु 400 | रु 1,500 | रु 3,900 |
| 4 | रु 1,100 | रु 600 | रु 1,700 | रु 5,600 |
| 5 | रु 1,100 | रु 800 | रु 1,900 | रु 7,500 |
| 6 | रु 1,100 | रु 1,000 | रु 2,100 | रु 9,600 |
| 7 | रु 1,100 | रु 1,200 | रु 2,300 | रु 11,900 |
| 8 | रु 1,100 | रु 1,400 | रु 2,500 | रु 14,400 |
| 9 | रु 1,100 | रु 1,600 | रु 2,700 | रु 17,100 |
| 10 | रु 1,100 | रु 1,800 | रु 2,900 | रु 20,000 |
| 11 | रु 1,100 | रु 2,000 | रु 3,100 | रु 23,100 |

The baseline excludes extra contributions and assumes every required payment is received. After the 10 completed months, the baseline saving is रु 20,000. Historical entry will determine the actual balance after pending amounts and extra contributions are applied.

# **7 Core user journeys**

## **7.1 Set up or import a month**

1\. The administrator opens a cycle and selects a month.

2\. The administrator sets the meeting date and records the winner.

3\. The website generates the correct amount due for every member.

4\. For historical months, the administrator records each member's status and payment method.

5\. The dashboard and saving totals update from the entered transactions.

## **7.2 Record a current payment**

1\. The administrator opens the current month.

2\. The administrator finds the member and selects Paid.

3\. The administrator selects eSewa, bank transfer, or cash.

4\. The website records the complete calculated amount and updates collected, pending, and saving totals.

## **7.3 Record an extra contribution**

1\. The administrator opens the saving fund section and adds an extra contribution.

2\. The administrator selects the contributor, enters the amount and payment method, and may add a short reason.

3\. The website adds the transaction to the saving balance and makes it visible to members.

## **7.4 Review group status**

1\. A member signs in with the shared member account.

2\. The member sees the current saving balance, its breakdown, the winner, collection progress, pending amount, and next meeting countdown.

3\. The member can open any month or cycle to inspect payment status, payment method, winners, and saving entries.

## **7.5 Change an exceptional meeting date**

1\. The administrator overrides the default last Saturday for one month.

2\. The dashboard countdown changes to the override date.

3\. Later months continue to use the last Saturday unless separately changed.

# **8 Information architecture**

| **Section** | **Purpose** | **Key content** |
|:---|:---|:---|
| Dashboard | Show the group's current position | Saving balance and breakdown, collection progress, pending amount, winner, eligible members, and meeting countdown |
| Monthly records | Manage and inspect monthly collections | Member dues, paid or pending status, payment method, winner, and calculated payout |
| Saving fund | Explain the saving balance | Fixed saving, interest, extra contributions, carried balance, and month or cycle filters |
| History | Preserve completed records | All months and cycles, historical winners, corrections, and last updated indicators |
| Members and winners | Track participation and eligibility | Member list, winner order, winning month, and remaining eligibility |

# **9 Functional requirements**

| **ID** | **Requirement** | **Definition** |
|:---|:---|:---|
| FR 01 | Authentication | The system shall provide a separate administrator login and one shared read-only member login. |
| FR 02 | Access control | The system shall prevent members from creating, editing, or deleting records. |
| FR 03 | Cycle management | The administrator shall be able to create a cycle, retain prior cycles, and complete an 11-month cycle. |
| FR 04 | Member roster | A cycle shall contain the 11 participating members and preserve their identity across monthly records. |
| FR 05 | Winner recording | The administrator shall record one winner per month from members who have not yet won in that cycle. |
| FR 06 | Due calculation | The system shall calculate रु 2,100, रु 2,300, or रु 100 according to the member's winner status. |
| FR 07 | Full payment only | The system shall record the calculated monthly obligation as either fully paid or pending; partial payments are not supported. |
| FR 08 | Payment method | A paid record shall require eSewa, bank transfer, or cash. |
| FR 09 | Component allocation | A paid amount shall be allocated automatically among Dhukuti, fixed saving, and interest. |
| FR 10 | Pending amounts | Unpaid obligations shall remain visible as pending and shall not increase collected balances. |
| FR 11 | Late payment | A later payment for an old obligation shall update the original month's record. |
| FR 12 | Saving balance | The system shall calculate the saving balance from carried balance, received fixed savings, received interest, and extra contributions. |
| FR 13 | Extra contribution | The administrator shall record contributor, amount, method, and an optional public reason. |
| FR 14 | Dashboard | The system shall show the current financial status, winner progress, pending amount, and next meeting countdown. |
| FR 15 | Schedule | The system shall default each month to the last Saturday in the Gregorian calendar and allow a month-specific override. |
| FR 16 | History | Authenticated users shall be able to view all completed months and cycles. |
| FR 17 | Corrections | The administrator shall be able to correct completed records, which shall display a last updated indicator. |
| FR 18 | Historical entry | The administrator shall be able to enter all 10 completed months of Cycle 1 before launch. |
| FR 19 | Cycle reset | Starting a new cycle shall reset winner eligibility and interest obligations while carrying the saving balance forward. |
| FR 20 | English interface | All Version 1 interface text shall be in English, with dates shown in the Gregorian calendar. |

# **10 Dashboard requirements**

| **Dashboard item** | **Definition** |
|:---|:---|
| Current saving balance | Actual received saving funds, including carried balance and extra contributions |
| Saving breakdown | Fixed saving, interest, extra contributions, and carried balance shown separately |
| Cycle progress | Current cycle and month, such as Cycle 1 Month 11 of 11 |
| Current winner | Winner for the selected month and the calculated रु 20,000 payout |
| Collection progress | Members paid out of 11 and total money received for the selected month |
| Pending amount | Total unpaid obligation for the selected month with access to the pending member list |
| Winner progress | Members who have won and members still eligible |
| Next meeting | Scheduled date and number of days remaining |

# **11 Monthly record requirements**

| **Field** | **Behavior** |
|:---|:---|
| Member | Display the member's name |
| Dhukuti due | Show रु 2,000 or रु 0 according to winner status |
| Fixed saving due | Show रु 100 for every member |
| Interest due | Show रु 200 only for a winner from an earlier month in the same cycle |
| Total due | Calculate the sum of the three components |
| Status | Allow Paid or Pending; display Winner where useful without replacing payment status |
| Payment method | Require eSewa, bank transfer, or cash when status is Paid |
| Last updated | Display after the administrator creates or corrects the record |

# **12 Design and usability requirements**

- Use a simple, minimalist interface with clear typography and restrained color.

- Prioritize the dashboard, payment table, and saving balance over decorative content.

- Make paid and pending states easy to distinguish without relying on color alone.

- Support mobile and desktop screen sizes because members may review records from their phones.

- Use whole Nepalese rupee amounts and consistent formatting throughout the product.

- Keep the administrator's monthly recording flow short and avoid requesting unnecessary fields.

# **13 Security and data requirements**

- Require authentication before showing any group or financial information.

- Store passwords securely and prevent member credentials from accessing editing functions.

- Validate financial amounts and winner eligibility on the server, not only in the interface.

- Retain records across cycles and protect them from accidental deletion.

- Use Asia Kathmandu as the operating timezone and Gregorian dates for scheduling.

- Back up the application data so monthly records can be restored after a failure.

# **14 Historical data entry**

Cycle 1 already contains 10 completed months. The administrator will enter the records manually before the group begins using the website for the final month.

For each historical month, the administrator must enter the meeting date, winner, each member's paid or pending status, each paid member's payment method, and any extra saving contributions. The website will calculate the monthly Dhukuti, fixed saving, interest, pending amount, and cumulative saving balance.

## **14.1 Historical reconciliation**

- Verify that 10 different members are recorded as winners.

- Verify that the remaining member is the only eligible winner for Month 11.

- Compare the calculated baseline saving of रु 20,000 after Month 10 with the actual records.

- Explain any difference through pending payments or recorded extra contributions.

- Do not use an unexplained manually entered balance to force reconciliation.

# **15 Version 1 acceptance criteria**

| **ID** | **Acceptance condition** |
|:---|:---|
| AC 01 | An unauthenticated visitor cannot view group information. |
| AC 02 | The shared member account can view all agreed records but cannot change them. |
| AC 03 | The administrator can record a winner, and the system prevents a second win in the same cycle. |
| AC 04 | The system calculates रु 2,100 for a member who has not won, रु 2,300 for a previous winner, and रु 100 for the current winner. |
| AC 05 | Marking a payment as paid requires one of the three approved payment methods and updates all related totals. |
| AC 06 | A pending payment is excluded from actual collected and saving balances. |
| AC 07 | A late payment updates the original month and recalculates subsequent cumulative totals. |
| AC 08 | An extra contribution increases the saving balance and displays its contributor, method, and optional reason. |
| AC 09 | The dashboard displays saving balance, saving breakdown, current winner, collection progress, pending amount, winner progress, and meeting countdown. |
| AC 10 | Changing one meeting date changes that month's countdown without changing later default dates. |
| AC 11 | The administrator can enter and correct all 10 historical months and see a last updated indicator. |
| AC 12 | Starting Cycle 2 resets eligibility and interest while carrying the Cycle 1 saving balance forward. |

# **16 Excluded from Version 1**

- Automated or random Chitta selection

- Payment processing or bank and wallet integrations

- Partial payments

- Late penalties

- Payment receipt or screenshot uploads

- Outgoing payout confirmation

- Saving fund withdrawals

- Gathering, lunch, or dinner expenses

- Birthday calendar and reminders

- Separate accounts for individual members

- Detailed audit logs

# **17 Future considerations**

Later releases may add birthday and event calendars, saving fund withdrawals for group gatherings, penalty rules, individual member accounts, receipt attachments, notifications, and more detailed change history. These features should not delay or complicate Version 1.

# **18 Final product decision**

Version 1 is a private transaction tracker for the group's Dhukuti and saving fund. Its primary job is to replace the Google Sheet with reliable calculations, simple administration, and a transparent read-only view for all friends.
