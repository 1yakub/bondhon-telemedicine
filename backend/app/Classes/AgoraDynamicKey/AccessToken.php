<?php

namespace App\Classes\AgoraDynamicKey;

use Exception;

class AccessToken
{
    public const RoleAttendee = 0;
    public const RolePublisher = 1;
    public const RoleSubscriber = 2;
    public const RoleAdmin = 101;

    public $appId;
    public $appCertificate;
    public $channelName;
    public $uid;
    public $ts;
    public $salt;
    public $messages = [];

    public function __construct($appId, $appCertificate, $channelName, $uid)
    {
        $this->appId = $appId;
        $this->appCertificate = $appCertificate;
        $this->channelName = $channelName;
        $this->uid = $uid;
        $this->ts = time() + 24 * 3600;
        $this->salt = rand(1, 99999999);
    }

    public function addPrivilege($privilege, $expireTimestamp)
    {
        $this->messages[$privilege] = $expireTimestamp;
        return $this;
    }

    public function build()
    {
        if (!$this->isUid($this->uid)) {
            return $this->buildUserAccount();
        }
        return $this->buildUid();
    }

    public function buildUid()
    {
        $rawMessage = $this->packMessages();
        $signature = hash_hmac('sha256', $rawMessage, $this->appCertificate, true);

        $crcChannelName = crc32($this->channelName) & 0xffffffff;
        $crcUid = crc32($this->uid) & 0xffffffff;

        $content = base64_encode(pack('V*', $crcChannelName, $crcUid, $this->salt));
        $version = '006';

        return $version . base64_encode($signature) . $content;
    }

    public function buildUserAccount()
    {
        $rawMessage = $this->packUserAccountMessages();
        $signature = hash_hmac('sha256', $rawMessage, $this->appCertificate, true);

        $crcChannelName = crc32($this->channelName) & 0xffffffff;
        $crcUid = crc32($this->uid) & 0xffffffff;

        $content = base64_encode(pack('V*', $crcChannelName, $crcUid, $this->salt));
        $version = '007';

        return $version . base64_encode($signature) . $content;
    }

    public function packMessages()
    {
        $buffer = pack('V', $this->salt);
        $buffer .= pack('V', $this->ts);
        $buffer .= pack('V', count($this->messages));

        foreach ($this->messages as $privilege => $expireTimestamp) {
            $buffer .= pack('v', $privilege);
            $buffer .= pack('V', $expireTimestamp);
        }

        return $buffer;
    }

    public function packUserAccountMessages()
    {
        $rawUid = pack('V', strlen($this->uid)) . $this->uid;
        $buffer = pack('V', $this->salt);
        $buffer .= pack('V', $this->ts);
        $buffer .= $rawUid;
        $buffer .= pack('V', count($this->messages));

        foreach ($this->messages as $privilege => $expireTimestamp) {
            $buffer .= pack('v', $privilege);
            $buffer .= pack('V', $expireTimestamp);
        }

        return $buffer;
    }

    public function isUid($uid)
    {
        if (is_int($uid)) {
            return true;
        }
        return is_numeric($uid);
    }
}

class Privileges
{
    const kJoinChannel = 1;
    const kPublishAudioStream = 2;
    const kPublishVideoStream = 3;
    const kPublishDataStream = 4;
    const kRtmLogin = 1000;
}