#! bin/bash
echo -e "\033[31m Please make sure your key to fill in the following \033[0m"
EXMAIL_CORP_ID='YOUR_EXMAIL_CORP_ID' \
EXMAIL_ADDRESS_LIST_SECRET='YOUR_EXMAIL_ADDRESS_LIST_SECRET' \
npm run test-cov;
