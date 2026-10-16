import fs from 'fs';

let content = fs.readFileSync('src/pages/ReferralProgramInfo.tsx', 'utf8');

// The problematic block in ReferralProgramInfo.tsx is currently:
//             ) : hasPendingRequest ? (
//               ...
//             ) : (
//               <div className="w-full text-center space-y-4">
//                 ... (Duplicate isEnrolled block)
//               </div>
//             ) : (
//               <button

// Find the index of ") : hasPendingRequest"
const pendingIdx = content.indexOf(') : hasPendingRequest');
// Find the next ") : (" which is right BEFORE the duplicate block
const firstColon = content.indexOf(') : (', pendingIdx);
// Find the NEXT ") : (" which is right BEFORE the button
const secondColon = content.indexOf(') : (', firstColon + 5);

if (pendingIdx !== -1 && firstColon !== -1 && secondColon !== -1) {
   // delete everything between firstColon and secondColon (exclusive of secondColon so we keep it)
   content = content.substring(0, firstColon) + content.substring(secondColon);
   content = content.replace('X,  X,', 'X,');
   fs.writeFileSync('src/pages/ReferralProgramInfo.tsx', content, 'utf8');
   console.log('Fixed syntax error');
} else {
   console.log('Could not find indices needed to fix', pendingIdx, firstColon, secondColon);
}
