export type Theme = {
  text: {
    primary: string;
    secondary: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  userSidebar: {
    backgroundColor: string;
    color: string;
  };
  conversationSidebar: {
    backgroundColor: string;
    color: string;
    conversationItem: {
      selected: string;
      hover: {
        backgroundColor: string;
      };
      title: {
        color: string;
        lastMessageColor: string;
      };
    };
  };
  messagePanel: {
    backgroundColor: string;
    color: string;
    header: {
      title: string;
    };
    body: {
      content: {
        color: string;
      };
    };
    inputContainer: {
      backgroundColor: string;
      color: string;
    };
  };
  participantSidebar: {
    backgroundColor: string;
    color: string;
  };
  page: {
    backgroundColor: string;
  };
  input: {
    backgroundColor: string;
    color: string;
  };
};

export const DarkTheme: Theme = {
  background: {
    primary: '#0b0b0b',
    secondary: '#111',
    tertiary: '#141414',
  },
  text: {
    primary: '#fff',
    secondary: '#5f5f5f',
  },
  userSidebar: {
    backgroundColor: '#0b0b0b',
    color: '#fff',
  },
  conversationSidebar: {
    backgroundColor: '#111',
    color: '#fff',
    conversationItem: {
      selected: '#1a1a1a',
      hover: {
        backgroundColor: '#222',
      },
      title: {
        color: '#fff',
        lastMessageColor: '#515151',
      },
    },
  },
  messagePanel: {
    backgroundColor: '#141414',
    color: '#fff',
    header: {
      title: '#fff',
    },
    body: {
      content: {
        color: '#fff',
      },
    },
    inputContainer: {
      backgroundColor: '#101010',
      color: '#fff',
    },
  },
  participantSidebar: {
    backgroundColor: '#111',
    color: '#fff',
  },
  page: {
    backgroundColor: '#1a1a1a',
  },
  input: {
    backgroundColor: '#202020',
    color: '#fff',
  },
};

export const LightTheme: Theme = {
  background: {
    primary: '#f5f5f5',
    secondary: '#ffffff',
    tertiary: '#eeeeee',
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
  },
  userSidebar: {
    backgroundColor: '#2c2c2c',
    color: '#ffffff',
  },
  conversationSidebar: {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    conversationItem: {
      selected: '#d4e4ff',
      hover: {
        backgroundColor: '#e8e8e8',
      },
      title: {
        color: '#1a1a1a',
        lastMessageColor: '#555555',
      },
    },
  },
  messagePanel: {
    backgroundColor: '#f0f0f0',
    color: '#1a1a1a',
    header: {
      title: '#1a1a1a',
    },
    body: {
      content: {
        color: '#1a1a1a',
      },
    },
    inputContainer: {
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
    },
  },
  participantSidebar: {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  page: {
    backgroundColor: '#f5f5f5',
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
};

// export const PurpleTheme: Theme = {
//   userSidebar: {
//     backgroundColor: '#1E1236',
//     color: '#fff',
//   },
//   conversationSidebar: {
//     backgroundColor: '#443762',
//     color: '#fff',
//     conversationItem: {
//       selected: '#8973BA',
//       hover: {
//         backgroundColor: '#352B4E',
//       },
//       title: {
//         color: '#000',
//         lastMessageColor: '#636363',
//       },
//     },
//   },
//   messagePanel: {
//     backgroundColor: '#3A2E59',
//     color: '#fff',
//     header: {
//       title: '#fff',
//     },
//     body: {
//       content: {
//         color: '#E3E3E3',
//       },
//     },
//     inputContainer: {
//       backgroundColor: '#4C4364',
//       color: '#000',
//     },
//   },
//   participantSidebar: {
//     backgroundColor: '#fff',
//     color: '#000',
//   },
//   page: {
//     backgroundColor: '#fff',
//   },
//   input: {
//     backgroundColor: '#54486D',
//     color: '#fff',
//   },
// };
