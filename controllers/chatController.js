import Chat from '../models/chatModel.js';
import matchingService from '../src/services/matchingService.js';
import { getIO } from '../src/services/ws.js';
import User from '../models/userModel.js';



// export const createChat = async (req, res) => {
//   try {
//     const user = req.user;
//     const { socketId } = req.body;
//     const io = getIO();

//     const waitingUsers = matchingService.waitingUsers;


//     if (waitingUsers.length === 0) {
//       matchingService.addToQueue(
//         user.id,
//         socketId,
//         user.interests,
//         user.genderPreference,
//         Date.now(),
//         user.name
//        );

//       return res.json({
//         success: true,
//         status: 'waiting',
//         message: "Added to waiting queue",
//       });
//     }

//     const filteredUsers = waitingUsers.filter(wuser => 
//       (wuser.genderPreference === user.genderPreference || wuser.genderPreference === 'both') &&
//       wuser.interests.some(interest => user.interests.includes(interest))
//     );
//     if (filteredUsers.length === 0) {
//       matchingService.addToQueue(
//         user.id,
//         socketId,
//         user.interests,
//         user.genderPreference,
//         Date.now(),
//         user.name
//       )
//       return res.json({
//         success: true,
//         status: 'waiting',
//         message: "No matching users found",
//       });
//     }

//     // ---------------- MATCH FOUND ----------------
//     const MatchingUser = waitingUsers.shift(); // remove from queue

//     const roomId = `${user.id}-${MatchingUser.userId}-${Date.now()}`;

//     // Save chat in DB
//     const newChat = new Chat({
//       user1: user.id,
//       user2: MatchingUser.userId,
//       roomId,
//     });

//     await newChat.save();

//     const matchUserData = await User.findById(MatchingUser.userId).select('-password');
//     const currentUserData = await User.findById(user.id).select('-password');
    
//     io.to(matchUserData.socketId).emit("matchFound", {
//       chat: newChat,
//     });

//     return res.json({
//       success: true,
//       message: "Matched successfully",
//       chat: newChat,
//       roomId,
//       status: 'matched'
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

function timeOut(userId) {
  setTimeout(() => {
    matchingService.removeFromQueue(userId);
  }, 30000);
}





export const createChat = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');

    const { socketId } = req.body;
    const io = getIO();

    const waitingUsers = matchingService.waitingUsers.map(u => u.userId);

    // If no users waiting, add to queue
    if (waitingUsers.length === 0) {
      matchingService.addToQueue(
        userId,
        socketId,
        user.interests,
        user.genderPreference,
        Date.now(),
        user.name
      );

      timeOut(userId);

      return res.json({
        success: true,
        status: 'waiting',
        message: "Added to waiting queue",
      });
    }

    let matchedUser = null;


    const MatchingUsers = waitingUsers.map(async (wuserId) => {
      
      const wuser = await User.findById(wuserId).select('-password');
  
      let currentUserSatisfied = false;
      let waitingUserSatisfied = false;

      

      if(user._id.toString() === wuser._id.toString()){
        return false;
      }

      if(!wuser.isOnline){
        return false;
      }
      //  console.log(user, wuser);
  
      
      if(user.genderPreference !== 'both'){
        currentUserSatisfied = user.genderPreference === wuser.gender;
      }
      
      if(wuser.genderPreference !== 'both'){
        waitingUserSatisfied = wuser.genderPreference === user.gender;
      }

      if(user.genderPreference === 'both'){
        currentUserSatisfied = true;
      }

      if(wuser.genderPreference === 'both'){
        waitingUserSatisfied = true;
      }


      if(currentUserSatisfied && waitingUserSatisfied){

        if(user.interests.length > 0 && wuser.interests.length > 0){
          const commonInterests = user.interests.filter(interest => wuser.interests.includes(interest));
          if(commonInterests.length > 0){
            matchedUser = wuser;

            return wuser;
          }
        }else{
          matchedUser = wuser;
          return wuser;
        }
        return false;
      }

    })

    // Wait for all promises to resolve
    await Promise.all(MatchingUsers);

    // If no matches found, add to queue
    if (!matchedUser) {
      const userExists = await waitingUsers.find(wuserId => wuserId === user._id.toString());

      if(!userExists){
        matchingService.addToQueue(
          userId,
          socketId,
          user.interests,
          user.genderPreference,
          Date.now(),
          user.name
        );
      }

      timeOut(userId);

      return res.json({
        success: true,
        status: 'waiting',
        message: "No matching users found. Added to queue.",
      });

   
    }


    
    // Remove matched user from waiting queue
    const matchedUserIndex = waitingUsers.findIndex(wuserId => wuserId === matchedUser._id.toString());
    
    if (matchedUserIndex !== -1) {
      waitingUsers.splice(matchedUserIndex, 1); // Remove from array
    }


    // Create unique room ID
    const roomId = `${user.id}-${matchedUser.userId}-${Date.now()}`;

    // Save chat in DB
    const newChat = new Chat({
      user1: user._id,
      user2: matchedUser._id,
      roomId,
      status: 'active',
      startedAt: new Date()
    });

    await newChat.save();

    // Get full user data
    const [matchedUserData, currentUserData] = await Promise.all([
      User.findById(matchedUser.userId).select('-password'),
      User.findById(user.id).select('-password')
    ]);

    // Notify the matched user
    io.to(matchedUser.socketId).emit("matchFound", {
      chat: newChat,
      partner: currentUserData,
      roomId: roomId
    });

    // Return response to current user
    return res.json({
      success: true,
      message: "Matched successfully",
      chat: newChat,
      partner: matchedUserData,
      roomId,
      status: 'matched'
    });

  } catch (error) {
    console.error("Error in createChat:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const chatPartner = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user.id;
    const chat = await Chat.findOne({ _id : chatId }).populate('user1', '-password').populate('user2', '-password');

    

    if (chat.user1._id.toString() === userId) {
      
      return res.json({ success: true, user: chat.user2 });
    } else if (chat.user2._id.toString() === userId) {
      
      return res.json({ success: true, user : chat.user1 });
    }

    return res.status(404).json({ success: false, message: 'Chat not found' });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getChat = async (req, res) => {

  try{
      const {chatId} = req.body;
      const chat = await Chat.findById(chatId).populate('user1', '-password').populate('user2', '-password');
      if(!chat){
        res.json({success: false, message: 'Chat not found'});
      }else{
        res.json({success: true, chat});
      }
    
  }catch{

  }

}

export const createImage = (req, res) => {
  const fileName = req.file.filename;

  const imageUrl = `uploads/image/${fileName}`

  if(!imageUrl){
    return res.json({success: false, message: 'Failed to upload image'});
  }

  return res.json({success: true, imageUrl});
}