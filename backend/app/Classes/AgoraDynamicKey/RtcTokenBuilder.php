<?php

namespace App\Classes\AgoraDynamicKey;

class RtcTokenBuilder
{
    const RoleAttendee = 0;
    const RolePublisher = 1;
    const RoleSubscriber = 2;
    const RoleAdmin = 101;

    /**
     * Build the RTC token with user account.
     *
     * @param $appId: The App ID issued to you by Agora.
     * @param $appCertificate: Certificate of the application that you registered in the Agora Dashboard.
     * @param $channelName: Unique channel name for the AgoraRTC session in the string format.
     * @param $userAccount: The user's account, max length is 255 Bytes.
     * @param $role: Role of the user. Either RoleAttendee, RolePublisher, RoleSubscriber, or RoleAdmin.
     * @param $privilegeExpiredTs: Represented by the number of seconds elapsed since 1/1/1970. If a privilege is not requested, set the corresponding Ts to 0.
     * @return The RTC token.
     */
    public static function buildTokenWithUserAccount($appId, $appCertificate, $channelName, $userAccount, $role, $privilegeExpiredTs)
    {
        $accessToken = new AccessToken($appId, $appCertificate, $channelName, $userAccount);
        $accessToken->addPrivilege(Privileges::kJoinChannel, $privilegeExpiredTs);

        if ($role == self::RoleAttendee || $role == self::RolePublisher || $role == self::RoleAdmin) {
            $accessToken->addPrivilege(Privileges::kPublishVideoStream, $privilegeExpiredTs);
            $accessToken->addPrivilege(Privileges::kPublishAudioStream, $privilegeExpiredTs);
            $accessToken->addPrivilege(Privileges::kPublishDataStream, $privilegeExpiredTs);
        }

        return $accessToken->build();
    }

    /**
     * Build the RTC token with UID.
     *
     * @param $appId: The App ID issued to you by Agora.
     * @param $appCertificate: Certificate of the application that you registered in the Agora Dashboard.
     * @param $channelName: Unique channel name for the AgoraRTC session in the string format.
     * @param $uid: User ID. A 32-bit unsigned integer with a value ranging from 1 to (2^32-1).
     * @param $role: Role of the user. Either RoleAttendee, RolePublisher, RoleSubscriber, or RoleAdmin.
     * @param $privilegeExpiredTs: Represented by the number of seconds elapsed since 1/1/1970. If a privilege is not requested, set the corresponding Ts to 0.
     * @return The RTC token.
     */
    public static function buildTokenWithUid($appId, $appCertificate, $channelName, $uid, $role, $privilegeExpiredTs)
    {
        $accessToken = new AccessToken($appId, $appCertificate, $channelName, $uid);
        $accessToken->addPrivilege(Privileges::kJoinChannel, $privilegeExpiredTs);

        if ($role == self::RoleAttendee || $role == self::RolePublisher || $role == self::RoleAdmin) {
            $accessToken->addPrivilege(Privileges::kPublishVideoStream, $privilegeExpiredTs);
            $accessToken->addPrivilege(Privileges::kPublishAudioStream, $privilegeExpiredTs);
            $accessToken->addPrivilege(Privileges::kPublishDataStream, $privilegeExpiredTs);
        }

        return $accessToken->build();
    }
}