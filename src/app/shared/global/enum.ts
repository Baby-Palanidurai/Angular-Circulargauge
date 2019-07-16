export enum SdbTaskID {
  Unknown = 0,
  enPrjConfig = 1,
  enEvent = 2,
  enOdbImport = 3,
  enEventDispatcher = 4,
  enUser = 6,
  enOdbFeatures = 7,
  enSchedule = 8,
  enZueb = 9,
  enReport = 10,
  enLocalize = 12,
  enSettings = 13,
  enObjects = 14,
  enVisualization = 15,
  enFunctions = 16,
  enRoomMng = 17,
  hiEventViewer = 1002,
  hiEventDispatcherViewer = 1004,
  hiVisualization = 1010,
  hiListViewer = 1011,
  hiAuditTrailViewer = 1012,
  hiEventPopupUI = 1013,
  hiTrendUI = 1014,
  hiStartClient = 1015,
  hiFunctionBlocksUI = 1016,
  hiObjectBoxUI = 1017,
  hiClientConfig = 1018,
  hiRoomMng = 1019,
  hiWebApp = 1020,
  rtStartPDM = 2001,
  rtEventHandler = 2002,
  rtEventDispatcher = 2004,
  rtSchedule = 2008,
  rtZueb = 2009,
  rtSqlGlt = 2010,
  rtStopPDM = 2011,
  rtDataLogger = 2012,
  rtFunctions = 2013,
  rtReport = 2014,
  rtFunctionBlocks = 2015,
  rtIOAssistant = 2016,
  rtEventService = 2017,
  pdEY36 = 3010,
  pdOPCClient = 3011,
  pdBACnetClient = 3012,
  pdEY24 = 3013,
  pdModbus = 3014,
  pdAmadeus = 3015,
  pdPLMaster = 3016,
  pdLuxmateBMS = 3017,
  pdMessaging = 3018,
  pdOPCUAClient = 3020,
  pdT940SI = 3100,
  pdOPCServer = 3101,
  pdOPCServerUA = 3102,
  pdBACnetServerIF = 3103,
  pdOPCUAServerWeatherData = 3104,
  SystemGroup = 5001,
  PdmToolsGroup = 5002
}

export enum Result {
  InsufficientRights = -21,
  NotFound = -20,
  PasswordInvalidMinSize = -17,
  MasterZuebNotConnected = -13,
  InvalidLogin = -12,
  InvalidSession = -11,
  MasterEvDpNotConnected = -8,
  MaxClientsConnected = -7,
  NotModified = -6,
  DataError = -5,
  IoError = -4,
  ClientNotConnected = -3,
  MasterOdbNotConnected = -1,
  Ok = 0
}

export enum LoginResult {
  Unknown = 0,
  Ok = 1,
  InvalidPassword = 2,
  InvalidUser = 3,
  InvalidSession = 4,
  PasswordExpired = 5,
  OkPasswordExpiresSoon = 6,
  InvalidLicense = 7,
  PasswordAccountDisabled = 8
}

export enum WebClientState {
  Idle = 0,
  WaitPdm = 1,
  TimedOut = 2,
  Running = 3
}

export enum SdbTaskState {
  Idle = 0,
  Running = 1,
  DelayedShutdown = 2,
  TimedOut = 3
}

export enum OdbBinding {
  // used for BdbTree queries
  All = -1,

  Unknown = 0,

  System = 1,
  Auxiliary = 2,

  EY3600 = 10,
  OPC = 11,
  BACnet = 12,
  EY2400 = 13,
  Modbus = 14,
  Amadeus = 15,
  PLMaster = 16,
  LuxmateBMS = 17,
  Messaging = 18,			// 15.06.15  CA only
  Sigmasys = 19,			// 16.07.15  npg only
  OPCUA = 20,					// 22.12.15  CA only
};

export enum OdbPropertyID {
  Unknown = -1,

  // properties as defined in ASHRAE BACnet Standard
  AckedTransitions = 0,
  ControlledVarValue = 21, // new 30.09.2009
  ElapsedActiveTime = 33,
  EventState = 36,
  FeedbackValue = 40,

  // not yet supported
  // HighLimit = 45,
  // LowLimit = 59,
  PresentValue = 85,

  // [Obsolete]
  // Reliability = 103,
  Setpoint = 108, // new, 30.09.2009

  StatusFlags = 111,
  SystemStatus = 112,

  AverageValue = 125, // new 15.02.2017

  //// non ASHRAE (private) types, starting at 4100
  ConnectionState = 4103,  // new V1.0.7
  FeedbackPrioManual = 4104, // new V1.0.13
  Tendency = 4105, // new V1.1.1

  CommandManual = 4200, // V1.06=514, public, not visible for user
  CommandValue = 4201,  // public, not visible for user
};

export enum OdbObjectType {
  Unknown = 0,
  Alarm = 1,
  Status = 2,
  Maintenance = 3,
  MultistateInput = 4,
  MultistateOutput = 5,
  BinaryOutput = 6,
  MultistateValue = 7,
  BinaryValue = 8,
  MeasuredValue = 10,
  Setpoint = 11,
  ManipulatedValue = 12,
  AnalogValue = 13,
  Loop = 14,
  EventEnrollment = 15,
  Command = 16,
  Counter = 20,
  CounterOperatingHours = 21,
  CounterConsumption = 22,
  Trigger = 30,
  Error = 31,
  Device = 32,
  PDM = 33,
  Network = 34,
  Averaging = 35,
}

export enum ObjGroupSelector {
  All = 0,            // alle Einträge der Tabelle
  IdOnly = 1,         // nur diese GroupID
  LevelOnly = 2,      // nur dieser Level
  LevelMaxLimit = 3,  // alle Level bis zum angegebenen
  IdPath = 4,         // GroupID + alle Parents dieser GroupID
  LevelMinLimit = 5,  // alle Level ab dem angegebenen
  IdOnlyJoinedDescr = 6, // mit '/' verbundene Descr
  LevelOnlyJoinedDescr = 7, // mit '/' verbundene Descr (Beispiel: Alle Orts-/Anlagenkennungen mit Level=6)
}

export enum OdbGroupLevel {
  Project = 0,
  InformationCenter = 1,
  SwitchPanel = 2,
  Plant = 3,
  PartialPlant = 4,
  FunctionalGroup = 5,
  OperatingResource = 6,
}

export enum OdbCommandPrioSymbol {
  Disabled = 0,
  Default = 1,
  LifeSafety,
  UnitProtect,
  Manual,
  Schedule
}

export enum GetObjTextScope {
  States = 1,
  Units = 2,
  BACnetProperties = 3
}

export enum SdbEnumId {
  All = -1,
  ObjectType = 1,
  PropertyID = 2,
  Reliability = 3,
  DeviceState = 4,
  ConnectionState = 5,
  CommandMode = 6,
  CommandState = 7,
  OdbBinding = 8,
  CommandType = 9,
  EventState = 10,
  StatusFlagsBits = 11,
  EventTransitionBits = 12,
  ErrorState = 13,
  BACnetNotifyType = 14,
  BACnetEventType = 15,
  Tendency = 16,
  AuditTrailAction = 101,
  AuditTrailText = 102,
  BACnetObjectType = 110,
  UnitGroup = 111,
  ModbusDataType = 112
}

export enum VarEnum {
  VT_EMPTY = 0,
  VT_NULL = 1,
  VT_I2 = 2,
  VT_I4 = 3,
  VT_R4 = 4,
  VT_R8 = 5,
  VT_CY = 6,
  VT_DATE = 7,
  VT_BSTR = 8,
  VT_DISPATCH = 9,
  VT_ERROR = 10,
  VT_BOOL = 11,
  VT_VARIANT = 12,
  VT_UNKNOWN = 13,
  VT_DECIMAL = 14,
  VT_I1 = 16,
  VT_UI1 = 17,
  VT_UI2 = 18,
  VT_UI4 = 19,
  VT_I8 = 20,
  VT_UI8 = 21,
  VT_INT = 22,
  VT_UINT = 23,
  VT_VOID = 24,
  VT_HRESULT = 25,
  VT_PTR = 26,
  VT_SAFEARRAY = 27,
  VT_CARRAY = 28,
  VT_USERDEFINED = 29,
  VT_LPSTR = 30,
  VT_LPWSTR = 31,
  VT_RECORD = 36,
  VT_FILETIME = 64,
  VT_BLOB = 65,
  VT_STREAM = 66,
  VT_STORAGE = 67,
  VT_STREAMED_OBJECT = 68,
  VT_STORED_OBJECT = 69,
  VT_BLOB_OBJECT = 70,
  VT_CF = 71,
  VT_CLSID = 72,
  VT_VECTOR = 4096,
  VT_ARRAY = 8192,
  VT_BYREF = 16384
}

export enum MultistateAdjustment {
  StateIndexToProcess = 1,
  ProcessToStateIndex,
};

export enum BACnetStatusFlagsBits {
  InAlarm = 0,
  Fault = 1,
  Overridden = 2,
  OutOfService = 3
}

export enum OdbStatusFlagsBits {
  InAlarm = BACnetStatusFlagsBits.InAlarm,
  Fault = BACnetStatusFlagsBits.Fault,
  Overridden = BACnetStatusFlagsBits.Overridden,
  OutOfService = BACnetStatusFlagsBits.OutOfService,
  Offline = 4,
};

export enum OdbStatusFlags {
  None = 0,
  OK = 0,
  InAlarm = (1 << OdbStatusFlagsBits.InAlarm),
  Fault = (1 << OdbStatusFlagsBits.Fault),
  Overridden = (1 << OdbStatusFlagsBits.Overridden),
  OutOfService = (1 << OdbStatusFlagsBits.OutOfService),
  Offline = (1 << OdbStatusFlagsBits.Offline),
  All = InAlarm | Fault | Overridden | OutOfService | Offline,
  AllButInAlarm = Fault | Overridden | OutOfService | Offline,
};

export enum OdbTendency {
  Steady,
  Rising = 1,
  Falling = 2,
};

export enum OdbStatusSymbol {
  Undefined = 0,
  OffL = 1,
  InAlActive = 2,
  InAlActiveAcked = 3,
  InAlInactiveNotAcked = 4,
  FltActive = 5,
  FltActiveAcked = 6,
  FltInactiveNotAcked = 7,
  OoS = 8,
  Ovr = 9,
  OK = 255,
};

export enum BACnetEventTransitions {
  None = 0,
  ToOffNormal = 1,
  ToFault = 2,
  ToNormal = 4,
  All = 7
};

export enum BACnetEventTransitionBits {
  ToOffNormal = 0,
  ToFault = 1,
  ToNormal = 2,
};

export enum AuthdbObjAccessRights {

  None = 0,
  Read = 1,
  Write = 2,
  Activate = 4,
  Acknowledge = 8,
  Engineering = 16,
  All = 31
}

export enum NoticePriority {
  Low = 10,
  Normal = 20,
  High = 30
}

export enum NoticeFlags {
  None = 0,
  EnforceOnAckToOffNormal = 1,
  EnforceOnAckToFault = 2,
  EnforceOnAckToNormal = 4,
  EnforceOnCommand = 8
}

export enum GetEventStatesFilterScope {
  None = 0,
  Active = 1,
  Inactive = 2,
  IncludeDisableDistribution = 4,
  All = 7
}

export enum BACnetNotifyType {
  Alarm = 0,
  Event = 1,
  AckNotification = 2
}

export enum BACnetEventState {
  Unknown = -1,
  Normal = 0,
  Fault = 1,
  Offnormal = 2,
  HighLimit = 3,
  LowLimit = 4,
  LifeSafetyAlarm = 5
}

export enum OdbCommandType {
  NotCommandable = 0,
  AutoManual = 1,
  ManualOnly = 2
}

export enum ObjCmdOptions {
  ShowCmdBtn = 1,
  DisableCmd = 2
}

export enum PdmServiceResult {
  Ok = 0,
  ProcessNotConnected,
  FailedSelectDestination,
  ProcessError,
  ProcessTimeout,
  NotImplemented,
  NotSupported,
}

export enum OdbPriorityLevel {
  RelinquishDefault = 0,
  ManualLifeSafety = 1,
  AutoLifeSafety = 2,
  CriticalEquipmentControl = 5,
  MinimumOnOff = 6,
  ManualOperator = 8,
  Auto = 16,
}

export enum PasswordResult {
  Unknown = 0,
  Ok = 1,
  PasswordAlreadyUsed = 2,
  InvalidPassword = 3,
  InvalidUser = 4,
  InvalidSession = 5,
}

export enum SdbPropertyId {
  EvDefGroupId = 1,
  EvDefNotifyType = 2,
  EvDefEventType = 3,
  EvDefTimeDelay = 4,
  EvDefHighLimit = 5,
  EvDefLowLimit = 6,
  EvDefDeadband = 7,
  EvDefStatesType = 8,
  EvDefStatesString = 9,
}

