/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Backpack plugin test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools'; // toolboxCategories
import {Backpack} from '../src/index';
import {ContentHighlight} from '@blockly/workspace-content-highlight';
import {FieldGridDropdown} from '@blockly/field-grid-dropdown';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);

  const backpack = new Backpack(workspace);
  backpack.init();
  const contentHighlight = new ContentHighlight(workspace);
  contentHighlight.init();
  createCustomBlocks(workspace);
  console.log(workspace);
  return workspace;
}
const cToolbox = `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox-categories" style="display: none">
<category name="Colour" categorystyle="colour_category">
  <block type="TableBlock">
    <mutation items="0"></mutation>
  </block>
</category>
</xml>`;

const createCustomBlocks = (workSpace) => {
  Blockly.Blocks['TableBlock'] = {
    init: function() {
      const tableOptionList = [
        ['From CSV', 'TableURL'],
        ['With Columns', 'TableCreate'],
        ['With JSON', 'TableCreateJSON'],
      ];
      this.appendValueInput('TableHeader')
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendField('Create Table', 'Table')
          .appendField(
              new FieldGridDropdown(tableOptionList,
                  this.elementSelectionListener),
              'TableOption',
          )
          .appendField(' ');
      this.setColour('#0381f4');
      this.setInputsInline(false);
      this.setOutput(true);
      this.where_ = 0;
      this.called = false;
      this.itemCount_ = 1;
      this.updateShape_();
      this.setCommentText('TableBlock');
    },

    elementSelectionListener: function(newValue) {
      const sourceBlock = this.getSourceBlock();
      if (sourceBlock) {
        const input = sourceBlock.getInput('TableHeader');
        const connectionBlock = input.connection.targetBlock();
        if (connectionBlock != null) {
          if (connectionBlock.isShadow()) {
            connectionBlock.dispose();
          } else {
            input.connection.disconnect();
          }
        }
        input.connection.setShadowDom(null);
        input.setCheck(null);

        if (newValue == 'TableURL') {
          sourceBlock.setMutator();
          for (let i = 0; i < sourceBlock.itemCount_; i++) {
            const connection = sourceBlock.getInput('ADD' + i).connection
                .targetConnection;
            if (connection) {
              const headertargetblock = sourceBlock
                  .getInput('ADD' + i)
                  .connection.targetBlock();
              if (headertargetblock.isShadow()) {
                headertargetblock.dispose();
              } else {
                sourceBlock.getInput('ADD' + i).connection.disconnect();
              }
            }
            if (this.getInput('ADD'+i)) {
              sourceBlock.removeInput('ADD' + i, true);
            }
          }
          sourceBlock.itemCount_ = 0;
          const urlShadowBlock = workSpace.newBlock('text');
          urlShadowBlock.setShadow(true);
          urlShadowBlock.initSvg();
          urlShadowBlock.render();
          urlShadowBlock.setFieldValue('Source', 'TEXT');
          const url = urlShadowBlock.outputConnection;
          // workSpace.newBlock('text').
          // setShadow(true).setFieldValue('Source', 'TEXT')
          try {
            input.connection.connect(url);
          } catch (error) {
            console.log('');
          }
        } else {
          // TODO
        }

        if (newValue == 'TableCreate') {
          sourceBlock.setMutator(new Blockly.Mutator(['TableColumnMutator']));
          const urlShadowBlock = workSpace.newBlock('text');
          urlShadowBlock.setShadow(true);
          urlShadowBlock.initSvg();
          urlShadowBlock.render();
          urlShadowBlock.setFieldValue('TableColumn', 'TEXT');
          const url = urlShadowBlock.outputConnection;
          try {
            input.connection.connect(url);
          } catch (error) {
            console.log('');
          }
        }
      }
    },

    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },

    domToMutation: function(xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    },

    // mutator dialog window creation
    decompose: function(workspace) {
      const containerBlock = workspace.newBlock('TableColumns');
      containerBlock.initSvg();
      this.called = true;
      let connection = containerBlock.getInput('STACK').connection;
      for (let i = 0; i < this.itemCount_; i++) {
        const itemBlock = workspace.newBlock('TableColumnMutator');
        itemBlock.initSvg();
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
      }
      return containerBlock;
    },

    // modify the original block from decompose mutator window
    compose: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const connections = [];
      while (itemBlock) {
        connections.push(itemBlock.valueConnection_);
        itemBlock = itemBlock.nextConnection &&
                itemBlock.nextConnection.targetBlock();
      }

      // Disconnect any children that don't belong.
      for (let i = 0; i < this.itemCount_; i++) {
        const connection = this.getInput('ADD' + i).connection.targetConnection;
        if (connection && connections.indexOf(connection) == -1) {
          connection.disconnect();
          connection.getSourceBlock().dispose();
        }
      }

      this.itemCount_ = connections.length;
      this.updateShape_();

      // Reconnect any child blocks.
      for (let i = 0; i < this.itemCount_; i++) {
        Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
      }
    },

    updateShape_: function() {
      if (this.itemCount_ && this.getInput('EMPTY')) {
        this.removeInput('EMPTY');
      } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
        // TODO
      }
      // Add new inputs.
      for (let i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          const input = this.appendValueInput('ADD' + i);
          const urlShadowBlock = this.workspace.newBlock('text');
          urlShadowBlock.setShadow(true);
          urlShadowBlock.initSvg();
          urlShadowBlock.render();
          urlShadowBlock.setFieldValue('TableColumn', 'TEXT');
          const url = urlShadowBlock.outputConnection;
          try {
            input.connection.connect(url);
          } catch (error) {
            console.log('');
          }
          if (i == 0) {
            // input.appendField(Blockly.Msg['LISTS_CREATE_WITH_INPUT_WITH']);
          }
        }
      }
      // Remove deleted inputs.
      let i=0;
      while (this.getInput('ADD' + i)) {
        this.removeInput('ADD' + i);
        i++;
      }
    },

    saveConnections: function(containerBlock) {
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      let i = 0;
      while (itemBlock) {
        const input = this.getInput('ADD' + i);
        itemBlock.valueConnection_ = input && input.connection.targetConnection;
        i++;
        itemBlock = itemBlock.nextConnection &&
              itemBlock.nextConnection.targetBlock();
      }
    },
  };
};
document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
    toolbox: cToolbox,
  };
  createPlayground(document.getElementById('root'), createWorkspace,
      defaultOptions);
});


