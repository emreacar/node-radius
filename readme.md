# A Framework for Radius Servers

>**_this project is still under development, it is highly recommended not to use it in the production environment._**

###### **Author:** Emre Acar <info@emreacar.com.tr>
###### **Co-Author:** Furkan ACAR <furkan@acar.digital>

Node-radius is a framework designed for nodeJS and written in javascript, specially designed for radius servers.

Encodes and decodes nas packets using # rfc-2865 protocol standards. It supports importing Radius Dictionaries to meet all user needs.


### Some Features (For now...)
- Block requests from unspecified NAS devices
- It can receive requests from more than one NAS device and separate port definition can be made for each device.
- Allows you to configure your own middleware rules for your more advanced authorization rules.

### Examples

#### Basic Usage

```javascript
import Radius from 'node-radius'

const server = new Radius()

server.on('request', function(req, res) {
  /**
    * You can do its operations in this section.
    */

  res.send()
})

server.start()
```

#### Adding Middleware
```javascript
const logger = require('logger')

const server = new Radius()

/** Middlewares works in the order of addition. **/

server.use((req, res, next) => {
	/** Do middleware stuff here **/
    res.locals.foo = 'bar'
	next()
})


server.use((req, res, next) => {
	/** If the Next method is not called, the next middleware is not called. In this case, it would be useful to end the response. **/
    res.end()
    /** or **/
    res.send()
})

server.on('request', function(req, res, next) {
  /**
    * You can do its operations in this section.
    */

  res.send()
  next()
})

/** you can add middleware after request method runs **/
server.use(logger)

server.start()
```

> ##### More usage examples and details about the use of the response object will be added later in the project.