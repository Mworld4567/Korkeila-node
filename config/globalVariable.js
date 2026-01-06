const globalAdminActions = {
    Login: 1,
    Logout: 2,
    UserCreate: 3,
    UserRead: 4,
    UserReadOne: 5,
    UserUpdate: 6,
    UserDelete: 7,
    RoleCreate: 8,
    RoleRead: 9,
    RoleReadOne: 10,
    RoleUpdate: 11,
    RoleDelete: 12,
};

const priceFlag = {
    NotSet: 0,
    Set: 1,
};

const filterAvailable = {
    NoDiamond: 0,
    SingleDiamond: 1,
    MultipleDiamond: 2,
};

const languageId = {
    English: 1,
    Finnish: 2,
};

const priceMessages = {
    enquirePrice: {
        [languageId.English]: "Please enquire for price...",
        [languageId.Finnish]: "Ole hyvä ja kysy hintaa...",
    },
    currencySymbol: "€ ",
};

module.exports = {
    globalAdminActions,
    priceFlag,
    filterAvailable,
    languageId,
    priceMessages,
};