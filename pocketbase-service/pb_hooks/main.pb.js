// OPTIONAL Delete mail that's older than 30 days

cronAdd("delete_stale_mail", "0 2 * * *", () => {
    const dao = $app.dao()
    
    const staleDate = new Date()
    staleDate.setDate(staleDate.getDate() - 30)
    const staleDateStr = staleDate.toISOString().split('T')[0] + ' 00:00:00.000Z'
    
    try {
        const staleFilter = `created < "${staleDateStr}"`
        const staleRecords = dao.findRecordsByFilter("posts", staleFilter, "-created", 0, 0)
        
        if (staleRecords.length === 0) {
            console.log("No stale mail found to delete")
            return
        }
        
        console.log(`Found ${staleRecords.length} stale emails to delete`)
        
        let deletedCount = 0
        for (let record of staleRecords) {
            try {
                dao.deleteRecord(record)
                deletedCount++
            } catch (err) {
                console.error(`Failed to delete email ${record.id}:`, err.message)
            }
        }
        
        console.log(`Successfully deleted ${deletedCount} stale posts`)
        
    } catch (err) {
        console.error("Error in delete_stale_mail cron:", err.message)
    }
})


// ========= FETCHING RECORDS

routerAdd("GET", "/api/mc/inbound_mail", (e) => {
    let username = e.requestInfo().query["username"]
    let domain = e.requestInfo().query["domain"]
    let records = $app.findRecordsByFilter(
        "inbound_mail",
        "username = {:username} && domain = {:domain}", // Filter (escaped)
        "-created", // sort
        500, // limit
        0, // offset
        {
          "username": username.toLowerCase(),
          "domain": domain.toLowerCase()
        }, // escaped values
    )
    return e.json(200, records)
})

routerAdd("GET", "/api/mc/logs", (e) => {
  let logs = arrayOf(new DynamicModel({
      id:      "",
      created: "",
      message: "",
      level:   0,
      data:    {},
  }))
  
  // see https://pocketbase.io/docs/js-database/#query-builder
  $app.logQuery().
    // target only debug and info logs
    andWhere($dbx.in("level", -4, 0)).
    // the data column is serialized json object and could be anything
    andWhere($dbx.exp("json_extract(data, '$.type') = 'request'")).
    orderBy("created DESC").
    limit(100).
    all(logs)
  return e.json(200, logs)
})


// ========= FORWARD MAIL

onRecordCreate((e) => {
  const indicator = 'MCb64'
  try {
    const {base64Encode, base64Decode} = require(`${__hooks}/utils.js`)
    const username = e.record['username']
    if (!username) return
    const dotSeparated = username.split('.')
    const finalItem = dotSeparated.slice(-1)
    const isMailCatcherB64Encoded = finalItem.startsWith(indicator)
    if (dotSeparated === 1 || !isMailCatcherB64Encoded) return

    const decoded = base64Decode(finalItem.slice(indicator.length))
    const encodedOptions = JSON.parse(decoded)

    // fw = forward address
    if (!encodedOptions.hasOwnProperty('fw')) return
    const message = new MailerMessage({
        from: {
          address: e.app.settings().meta.senderAddress,
          name: e.app.settings().meta.senderName,
        },
        to: [{address: encodedOptions['fw']}],
        subject: e.record['subject'],
        html: e.record['html'],
        // bcc, cc and custom headers are also supported...
    })
    e.app.newMailClient().send(message)
  } catch (e) {
    console.error(e)
  } finally {
    e.next()
  }
}, "inbound_mail")


// ========= MAILIN WEBHOOKS

routerAdd("HEAD", "/api/mc/webhook/mailin", (e) => {
  e.noContent(200)
})

routerAdd("POST", "/api/mc/webhook/mailin", (e) => {
  const ct = e.request.header.get("content-type");
  if (!ct || !ct.includes("multipart/form-data")) {
    console.log("Expected multipart/form-data")
    return e.string(400, "Expected multipart/form-data");
  }

  e.request.parseMultipartForm()
  const parsed = e.request.multipartForm;

  if (!parsed?.value) {
    console.log("Missing 'mailinMsg' field")
    return e.string(400, "Missing 'mailinMsg' field");
  }

  let username;
  let restProps;
  let text;
  let html;
  let subject;
  let domain;

  try {
    let mailData = parsed.value;
    html = JSON.parse(mailData.mailinMsg[0]).html
    text = JSON.parse(mailData.mailinMsg[0]).text
    subject = JSON.parse(mailData.mailinMsg[0]).headers.subject
    restProps = JSON.stringify(Object.entries(parsed))
    const usernameRaw = JSON.parse(mailData.mailinMsg[0]).headers.to
    const emailMatch = usernameRaw.split(' ');
    if (emailMatch.length === 2) {
      const email = emailMatch[1].replace('<', '').replace('>', '');
      [username, domain] = email.split('@');
    } else if (emailMatch.length === 1) {
      const email = emailMatch[0]
      [username, domain] = email.split('@');
    }
  } catch (err) {
    console.log("Invalid JSON: " + err.message)
    return e.string(400, "Invalid JSON: " + err.message);
  }
  try {
    console.log("Saving mail")
    let collection = $app.findCollectionByNameOrId("inbound_mail")
    let record = new Record(collection)
    record.set('restProps', restProps)
    record.set('html', html)
    record.set('text', text)
    record.set('subject', subject)
    record.set('domain', domain.toLowerCase())
    record.set('username', username.toLowerCase())
    $app.save(record);

    return e.string(200, "OK");
  } catch (err) {
    console.log("Create failed: " + err.message)
    return e.string(500, "Create failed: " + err.message);
  }
})

