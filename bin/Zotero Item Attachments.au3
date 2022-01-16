#include <File.au3>
#include <MsgBoxConstants.au3>
#include <FileConstants.au3>
#include <WinAPIFiles.au3>
#include <Array.au3>

#pragma compile(Icon, '..\client\img\icon\favicon.ico')

$ParentDir = StringLeft(@scriptDir,StringInStr(@scriptDir,"\",0,-1)-1)
$CMD = "npm run start-electron"
Run(@ComSpec & " /c " & $CMD, $ParentDir, @SW_HIDE)
#RunWait(@ComSpec & " /c " & $CMD, $ParentDir, @SW_SHOW)
