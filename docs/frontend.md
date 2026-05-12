# Frontend Explanation

The frontend is a React + TypeScript + Vite application with TailwindCSS.

## Main UX Goals

- Make the consumer verification flow the main demo feature.
- Show clear role-based workflows.
- Keep all blockchain operations transparent to the user.
- Show transaction hashes and errors clearly.
- Avoid generic admin-panel UI.

## Pages

- Login/Register: MetaMask-focused entry point.
- Dashboard: system overview and analytics preview.
- Manufacturer Dashboard: batch and product creation workflow.
- Distributor Dashboard: transfer workflow.
- Pharmacy Dashboard: delivery and sale workflow.
- Product Verification Page: serial number and QR verification.
- Product Details Page: product history and metadata.
- Recall Management Page: regulator recall/unrecall.
- Analytics Page: cached event and metadata counters.

## Blockchain Integration

`src/lib/contract.ts` contains the contract ABI and all `ethers.js` calls. The UI never invents product ownership or recall status locally; it reads those facts from the smart contract.

## QR Verification

The manufacturer flow generates a QR code containing:

```text
/verify?serial=SERIAL_NUMBER
```

The consumer page reads this value and calls `verifyProductBySerial()`.
