export const RoverTheme = {
  "name": "RoverDriver",
  "rounding": 2,
  "spacing": 24,
  "defaultMode": "dark",
  "global": {
    "colors": {
      "brand": {
        "dark": "#C74375",
        "light": "#C74375"
      },
      "background": {
        "light": "#EEEEEE",
        "dark": "#212429"
      },
      "background-back": {
        "light": "#EEEEEE",
        "dark": "#1F2133"
      },
      "background-front": {
        "dark": "#272A2F",
        "light": "#FFFFFF"
      },
      "background-contrast": {
        "dark": "#FFFFFF11",
        "light": "#11111120"
      },
      "text": {
        "dark": "#EEEEEE",
        "light": "#333333"
      },
      "text-strong": {
        "dark": "#FFFFFF",
        "light": "#000000"
      },
      "text-weak": {
        "dark": "#CCCCCC",
        "light": "#444444"
      },
      "text-xweak": {
        "dark": "#999999",
        "light": "#666666"
      },
      "border": {
        "dark": "#444444",
        "light": "#CCCCCC"
      },
      "control": "brand",
      "active-background": "background-contrast",
      "active-text": "text-strong",
      "selected-background": "brand",
      "selected-text": "text-strong",
      "status-critical": "#FF4040",
      "status-warning": "#FFAA15",
      "status-ok": "#00C781",
      "status-unknown": "#CCCCCC",
      "status-disabled": "#CCCCCC",
      "graph-0": "brand",
      "graph-1": "status-warning",
      "focus": {
        "light": "#CC912E",
        "dark": "#CC912E"
      },
      'accent-1': "#CC912E",
      'accent-2': '#FD6FFF',
      'accent-3': '#00ABE8',
      'accent-4': '#00873D',
    },
    "edgeSize": {
      'small': '8px'
    },
    "font": {
      "family": "Helvetica"
    },
    "active": {
      "background": "active-background",
      "color": "active-text"
    },
    "hover": {
      "background": "active-background",
      "color": "active-text"
    },
    "selected": {
      "background": "selected-background",
      "color": "selected-text"
    },
    "control": {
      "border": {
        "radius": "0px"
      }
    },
    "drop": {
      "border": {
        "radius": "0px"
      }
    }
  },
  "chart": {},
  "diagram": {
    "line": {}
  },
  "meter": {},
  "button": {
    "border": {
      "radius": "0px"
    }
  },
  "checkBox": {
    "check": {
      "radius": "0px"
    },
    "toggle": {
      "radius": "0px"
    }
  },
  "radioButton": {
    "check": {
      "radius": "0px"
    }
  },
  "formField": {
    "border": {
      "color": "border",
      "error": {
        "color": {
          "dark": "white",
          "light": "status-critical"
        }
      },
      "position": "inner",
      "side": "bottom"
    },
    "content": {
      "pad": "small"
    },
    "disabled": {
      "background": {
        "color": "status-disabled",
        "opacity": "medium"
      }
    },
    "error": {
      "color": "status-critical",
      "margin": {
        "vertical": "xsmall",
        "horizontal": "small"
      }
    },
    "help": {
      "color": "dark-3",
      "margin": {
        "start": "small"
      }
    },
    "info": {
      "color": "text-xweak",
      "margin": {
        "vertical": "xsmall",
        "horizontal": "small"
      }
    },
    "label": {
      "margin": {
        "vertical": "xsmall",
        "horizontal": "small"
      }
    },
    "margin": {
      "bottom": "small"
    },
    "round": "0px"
  },
  "tab": {
    "color": 'text',
    "active": {
      "background": 'background-contrast',
      "color": "brand"
    },
    "hover": {
      "background": 'background-front',
      "color": 'control',
    },
    "border": {
      "side": 'bottom',
      "color": 'background-front',
      "active": {
        "color": 'brand',
      },
      "hover": {
        "color": 'control',
      },
    },
    "pad": 'small',
    "margin": 'none'
  },
  "rangeInput": {
    "track": {
      "height": '10px',
      "lower": {
        "color": 'brand',
        "opacity": 0.7,
      },
      "upper": {
        "color": 'background-contrast',
        "opacity": 0.3,
      },
    },
  },

}