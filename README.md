# Deno Triage Rotation

This sample app allows users to create, manage, and delete rotation or on-call
assignments. This app uses datastores to store rotations on a per-channel basis.

![deno-triage-rotation](https://user-images.githubusercontent.com/55667998/215822815-8555fdb2-694a-4799-b9fc-59670519ae6e.gif)

**Guide Outline**:

- [Supported Workflows](#supported-workflows)
- [Setup](#setup)
  - [Install the Slack CLI](#install-the-slack-cli)
  - [Clone the Template](#clone-the-template)
- [Create a Link Trigger](#create-a-link-trigger)
- [Running Your Project Locally](#running-your-project-locally)
- [Usage](#usage)
  - [Manage Rotation](#workflow-1-manage-rotation)
  - [Advance Rotation](#workflow-2-advance-rotation)
- [Datastores](#datastores)
- [Testing](#testing)
- [Deploying Your App](#deploying-your-app)
  - [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Supported Workflows

- **Manage rotation**: Create, manage, or delete an existing rotation. This
  workflow is triggered by a shortcut.
- **Advance rotation**: This workflow updates the rotation to the latest,
  notifies users. This workflow is triggered by a schedule.

## Setup

Before getting started, make sure you have a development workspace where you
have permissions to install apps. If you don’t have one set up, go ahead and
[create one](https://slack.com/create). Also, please note that the workspace
requires any of [the Slack paid plans](https://slack.com/pricing).

### Install the Slack CLI

To use this template, you first need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/future/quickstart).

### Clone the Template

Start by cloning this repository:

```zsh
# Clone this project onto your machine
$ slack create triage-rotation -t slack-samples/deno-triage-rotation

# Change into this project directory
$ cd triage-rotation
```

## Create a Link Trigger

[Triggers](https://api.slack.com/future/triggers) are what cause workflows to
run. These triggers can be invoked by a user, or automatically as a response to
an event within Slack.

A [link trigger](https://api.slack.com/future/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app). When creating a trigger, you must select
the Workspace that you'd like to create the trigger in. Each Workspace has a
development version (denoted by `(dev)`), as well as a deployed version.

To create a link trigger for the workflow in this template, run the following
command:

```zsh
$ slack trigger create --trigger-def triggers/manage_rotation.ts
```

After selecting a Workspace, the output provided will include the link trigger
Shortcut URL. Copy and paste this URL into a channel as a message, or add it as
a bookmark in a channel of the Workspace you selected.

**Note: this link won't run the workflow until the app is either running locally
or deployed!** Read on to learn how to run your app locally and eventually
deploy it to Slack hosting.

## Running Your Project Locally

While building your app, you can see your changes propagated to your workspace
in real-time with `slack run`. In both the CLI and in Slack, you'll know an app
is the development version if the name has the string `(dev)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

Once running, click the
[previously created Shortcut URL](#create-a-link-trigger) associated with the
`(dev)` version of your app. This should start the included sample workflow.

To stop running locally, press `<CTRL> + C` to end the process.

## Usage

Add your dev app to the channel where you shared your link trigger as a member.
You can do this by @mentioning the app directly in a message in the channel.

### Workflow 1: Manage Rotation

With your app running locally (`slack run`), click the link trigger that you
shared in your Slack workspace. The workflow's first step, an input form, will
appear where you can complete the required fields to create a rotation for the
channel where you triggered the worklow.

If a rotation belonging to the channel already exists, the form will show
details about the rotation and allow you to edit those fields.

After you submit the form, the next step in the workflow creates a rotation and
creates a scheduled trigger for workflow #2: Advance Rotation.

To check whether your rotation has been created, just trigger the workflow from
the channel again and look at the existing rotation details. You can also delete
an existing rotation from this form.

### Workflow 2: Advance Rotation

This workflow is triggered by a a scheduled trigger created in a step in the
earlier workflow. This workflow notifies the current rotation assignee in the
channel and then advances the rotation.

:lightbulb: This app comes set up with a `.env` file and the ability to turn on
a `debugMode` to give you a bit more control on when _Advance Rotation_ (see,
`workflows/advance_rotation.ts`) is triggered. I've found this helpful in
debugging.

## Datastores

This app uses a datastore, see `datastores/rotations.ts`. Using a datastore also
requires the `datastore:write`/`datastore:read` scopes, which is included in
your app's `manifest.ts` file.

## Testing

For an example of how to test a function, see
`functions/advance_rotation/handler_test.ts`. Test filenames should be suffixed
with `_test`.

Run all tests with `deno test`:

```zsh
$ deno test
```

## Deploying Your App

Once you're done with development, you can deploy the production version of your
app to Slack hosting using `slack deploy`:

```zsh
$ slack deploy
```

After deploying, [create a new link trigger](#create-a-link-trigger) for the
production version of your app (not appended with `(dev)`). Once the trigger is
invoked, the workflow should run just as it did in when developing locally.

### Viewing Activity Logs

Activity logs for the production instance of your application can be viewed with
the `slack activity` command:

```zsh
$ slack activity
```

## Project Structure

### `manifest.ts`

The [app manifest](https://api.slack.com/future/manifest) contains the app's
configuration. This file defines attributes like app name and description.

### `slack.json`

Used by the CLI to interact with the project's SDK dependencies. It contains
script hooks that are executed by the CLI and implemented by the SDK.

### `/functions`

[Functions](https://api.slack.com/future/functions) are reusable building blocks
of automation that accept inputs, perform calculations, and provide outputs.
Functions can be used independently or as steps in workflows.

### `/workflows`

A [workflow](https://api.slack.com/future/workflows) is a set of steps that are
executed in order. Each step in a workflow is a function.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/future/forms) before continuing
to the next step.

### `/triggers`

[Triggers](https://api.slack.com/future/triggers) determine when workflows are
executed. A trigger file describes a scenario in which a workflow should be run,
such as a user pressing a button or when a specific event occurs.

### `/datastores`

[Datastores](https://api.slack.com/future/datastores) can securely store and
retrieve data for your application. Required scopes to use datastores include
`datastore:write` and `datastore:read`.

## Resources

To learn more about developing with the CLI, you can visit the following guides:

- [Creating a new app with the CLI](https://api.slack.com/future/create)
- [Configuring your app](https://api.slack.com/future/manifest)
- [Developing locally](https://api.slack.com/future/run)

To view all documentation and guides available, visit the
[Overview page](https://api.slack.com/future/overview).
