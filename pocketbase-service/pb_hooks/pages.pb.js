routerAdd("get", "/", (c) => {
    const html = $template.loadFiles(
      `${__hooks}/views/index.html`,
    ).render({
      PB_HOST: process.env.PB_HOST,
      MAIL_DOMAINS: process.env.MAIL_DOMAINS,
      SERVICE_NAME: process.env.SERVICE_NAME
    })
  
    return c.html(200, html)
  })
  
routerAdd("get", "/emails", (c) => {
    const html = $template.loadFiles(
      `${__hooks}/views/layout.html`,
      `${__hooks}/views/emailList.html`,
    ).render({
      PB_HOST: process.env.PB_HOST,
      SERVICE_NAME: process.env.SERVICE_NAME
    })
  
    return c.html(200, html)
  })
  
routerAdd("get", "/emails/{mailId}", (c) => {
  try {
    const mailId = c.request.pathValue("mailId")
    let record = $app.findRecordById("inbound_mail", mailId)
    if (!record) {
      throw new Error('No mail record found for given ID')
    }
    const html = $template.loadFiles(
      `${__hooks}/views/layout.html`,
      `${__hooks}/views/emailContent.html`,
    ).render({
      ENABLE_HTML_RENDERING: process.env.ENABLE_HTML_RENDERING,
      PB_HOST: process.env.PB_HOST,
      SERVICE_NAME: process.env.SERVICE_NAME,
      MAIL_HTML: record.get('html'),
      MAIL_TEXT: record.get('text'),
      MAIL_USERNAME: record.get('username'),
      MAIL_DOMAIN: record.get('domain'),
      MAIL_SUBJECT: record.get('subject')
    })
  
    return c.html(200, html)
  } catch (e) {
    // That's a todo if I've ever seen one
    return c.string(404, e.message)
  }
})
