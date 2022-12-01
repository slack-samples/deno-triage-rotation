import {
  ActionsBlock,
  Button,
  DividerBlock,
  HeaderBlock,
  InputBlock,
  ModalView,
  MultiUsersSelect,
  Option,
  SectionBlock,
} from "https://cdn.skypack.dev/@slack/types?dts";

import { Rotation } from "../../datastores/rotations.ts";
import { WEEKDAY } from "../create_rotation/handler.ts";

// constants
export const ROTATION_FORM_CALLBACK_ID = "rotation_form";
export const DELETE_BUTTON_ACTION_ID = "delete_rotation";
const INDENT_SIZE = 3;

/**
 * Check out Block Kit UI: https://api.slack.com/block-kit for more information on
 * how to customize the order and appearance of information on your function surfaces
 */
export const buildRotationForm = (
  channel: string,
  rotation?: Rotation,
): ModalView => {
  // describes purpose of the form
  const descriptionSection: SectionBlock = mrkdwnSection(
    `Manage an existing rotation or create a new one for: \n<#${channel}>`,
  );

  // the current status of any existing rotations
  const rotationDetail = rotation
    ? `*Current rotation*\n${
      getFormattedRotationFrequency(rotation)
    } \n\n*Current order*\n${
      getFormattedRotationOrder(rotation).join("\n")
    }\n\n`
    : `_You have no current rotations! :shrug:_`;

  const rotationDetailSection: SectionBlock = mrkdwnSection(rotationDetail);

  // a delete button that our OpenFormFunction will handle
  const deleteButton: Button = {
    type: "button",
    text: {
      text: "Delete Rotation",
      type: "plain_text",
      emoji: false,
    },
    style: "danger",
    action_id: DELETE_BUTTON_ACTION_ID,
  };

  // additional actions to perform on the rotation
  const rotationActions: ActionsBlock | SectionBlock = rotation
    ? {
      type: "actions",
      block_id: "rotation_actions",
      elements: [
        deleteButton,
      ],
    }
    : mrkdwnSection(" ");

  // the updated or new rotation order
  const rotationUsersSelect: MultiUsersSelect = {
    type: "multi_users_select",
    initial_users: rotation ? rotation.order : undefined,
    placeholder: {
      type: "plain_text",
      text: "Select users for rotation",
      emoji: true,
    },
    focus_on_load: true,
    action_id: "select_action",
  };

  const rotationInput: InputBlock = {
    type: "input",
    block_id: "rotation_input",
    element: rotationUsersSelect,
    label: {
      type: "plain_text",
      text: "Order",
      emoji: true,
    },
  };

  const divider: DividerBlock = {
    type: "divider",
  };

  const setupHeader: HeaderBlock = rotation
    ? {
      type: "header",
      text: {
        type: "plain_text",
        text: "Edit rotation",
      },
      block_id: "setup_header_block",
    }
    : {
      type: "header",
      text: {
        type: "plain_text",
        text: "Create rotation",
      },
    };

  const repeatsEveryInputInitialValue = rotation
    ? `${rotation.repeats_every_number}`
    : undefined;
  const repeatsEveryInput: InputBlock = {
    type: "input",
    block_id: "repeats_every-input",
    element: {
      type: "number_input",
      is_decimal_allowed: false,
      min_value: "1",
      action_id: "repeats_every-number-input",
      initial_value: repeatsEveryInputInitialValue,
      focus_on_load: false,
    },
    label: {
      type: "plain_text",
      text: "Repeats every",
      emoji: true,
    },
  };

  const repeatsEverySectionInitialOption = rotation
    ? getFrequencyOption(rotation.repeats_every)
    : undefined;

  const repeatsEverySection: InputBlock = {
    type: "input",
    block_id: "repeats_every-section",
    label: {
      type: "plain_text",
      text: " ",
    },
    element: {
      action_id: "repeats_every-radio-buttons",
      type: "radio_buttons",
      initial_option: repeatsEverySectionInitialOption,
      options: [getFrequencyOption("day"), getFrequencyOption("week")],
    },
  };

  const startDate = rotation
    ? dateFromTimeInSec(rotation.start_time) // convert our time in unix sec to ms
    : new Date();

  const startDatepickerInput: InputBlock = {
    type: "input",
    block_id: "start_datepicker-input",
    element: {
      type: "datetimepicker",
      initial_date_time: getUNIXDateTimeInSeconds(startDate),
      action_id: "start_datepicker-datepicker",
    },
    hint: {
      type: "plain_text",
      text:
        "If repeating weekly, the rotation will advance on selected weekday and time",
    },
    label: {
      type: "plain_text",
      text: "Starting",
      emoji: true,
    },
  };

  const customMessageInitialValue = rotation ? rotation.message : "";
  const customMessageInput: InputBlock = {
    type: "input",
    block_id: "custom_message-input",
    element: {
      type: "plain_text_input",
      action_id: "custom_message-plain-text-input",
      multiline: true,
      initial_value: customMessageInitialValue,
    },
    label: {
      type: "plain_text",
      text: "Custom message",
    },
    hint: {
      type: "plain_text",
      text:
        "Custom message will be posted in channel tagging the current rotation assignee",
    },
    optional: true,
  };

  // Complete form for managing a modal
  const formView: ModalView = {
    type: "modal",
    callback_id: ROTATION_FORM_CALLBACK_ID,
    submit: {
      text: "Save",
      type: "plain_text",
    },
    notify_on_close: true,
    title: { text: "Manage Channel Rotation", type: "plain_text" },
    blocks: [
      descriptionSection,
      divider,
      rotationDetailSection,
      divider,
      setupHeader,
      rotationInput,
      repeatsEveryInput,
      repeatsEverySection,
      startDatepickerInput,
      customMessageInput,
      rotationActions,
    ],
  };

  console.log(formView);
  return formView;
};

// Helpers
// returns a human-readable description of the rotation frequency
function getFormattedRotationFrequency(rotation: Rotation): string {
  const {
    repeats_every,
    repeats_every_number,
    next_advance_time,
  } = rotation;

  // if repeats_every_number > 1, then e.g. 2 weeks or 10 days, otherwise, week or day
  const frequency = repeats_every_number === 1
    ? repeats_every
    : `${repeats_every}s`;

  const frequencyNumber = repeats_every_number === 1
    ? ""
    : `${repeats_every_number} `;

  const nextRotationDate = dateFromTimeInSec(next_advance_time);

  const nextRotationTime =
    `${nextRotationDate.toDateString()}, ${nextRotationDate.toTimeString()}`;

  const dayExpectation = repeats_every === "day"
    ? ""
    : `, on ${WEEKDAY[(dateFromTimeInSec(next_advance_time)).getDay()]}`;

  return `This rotation advances every *${frequencyNumber}${frequency}${dayExpectation}*. Next scheduled:\n_${getIndent()}${nextRotationTime}_`;
}

function getFormattedRotationOrder(rotation: Rotation): Array<string> {
  return rotation.order.map((user: string, id: number) => {
    // add basic list formatting
    let formatted = `${getIndent()}<@${user}>`;

    // the first in the order is always the next user to be assigned the rotation
    // when the rotation next advances that user is notified, then they are
    // added to the end of the order
    if (id === 0) {
      formatted += ", _(next on rotation)_";
    }
    return formatted;
  });
}

// Block Kit Utility
function mrkdwnSection(text: string): SectionBlock {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: text,
    },
  };
}

function getUNIXDateTimeInSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function getFrequencyOption(frequency: string): Option {
  return {
    text: {
      type: "plain_text",
      text: `${frequency}(s)`,
    },
    value: frequency,
  };
}

function getIndent(): string {
  return Array(INDENT_SIZE).fill(" ").reduce((acc, curr) => acc += curr);
}

export function dateFromTimeInSec(timeInSec: number): Date {
  return new Date(timeInSec * 1000);
}
