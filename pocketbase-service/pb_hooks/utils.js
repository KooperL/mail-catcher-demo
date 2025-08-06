module.exports = {
   // https://github.com/pocketbase/pocketbase/issues/5807
   base64Encode(str) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let encoded = '';
      let i = 0;

      while (i < str.length) {
         let char1 = str.charCodeAt(i++);
         let char2 = i < str.length ? str.charCodeAt(i++) : NaN;
         let char3 = i < str.length ? str.charCodeAt(i++) : NaN;

         let enc1 = char1 >> 2;
         let enc2 = ((char1 & 3) << 4) | (char2 >> 4);
         let enc3 = ((char2 & 15) << 2) | (char3 >> 6);
         let enc4 = char3 & 63;

         if (isNaN(char2)) {
            enc3 = enc4 = 64;
         } else if (isNaN(char3)) {
            enc4 = 64;
         }

         encoded += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
      }

      return encoded;
   },

   base64Decode(str) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let decoded = '';
      let i = 0;

      str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');

      while (i < str.length) {
         let enc1 = chars.indexOf(str.charAt(i++));
         let enc2 = chars.indexOf(str.charAt(i++));
         let enc3 = chars.indexOf(str.charAt(i++));
         let enc4 = chars.indexOf(str.charAt(i++));

         let char1 = (enc1 << 2) | (enc2 >> 4);
         let char2 = ((enc2 & 15) << 4) | (enc3 >> 2);
         let char3 = ((enc3 & 3) << 6) | enc4;

         decoded += String.fromCharCode(char1);

         if (enc3 !== 64) {
            decoded += String.fromCharCode(char2);
         }
         if (enc4 !== 64) {
            decoded += String.fromCharCode(char3);
         }
      }

      return decoded;
   }
}
