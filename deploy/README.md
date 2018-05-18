# Deploy on App Engine Flex

* Build the static ui:
```
rm -r build/
cd ../ui
npm run-script build
mv build/ ../deploy
cd ../deploy
```

* Deploy the UI server:
```
gcloud app deploy ui-app.yaml
```

* Ensure that `api/config` contains the correct dataset and facet fields for your project and index

* Deploy the API server:
```
cd ../api && gcloud app deploy && cd ../deploy
```