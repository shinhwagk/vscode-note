workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Master", "Slack"]
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Test" {
  needs = ["Install"]
  uses = "actions/npm@master"
  args = "test"
}

action "Master" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Slack" {
  uses = "Ilshidur/action-slack@master"
  needs = ["Test"]
}
