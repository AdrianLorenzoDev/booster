import * as Oclif from '@oclif/command'
import { Script } from '../../common/script'
import Brand from '../../common/brand'
import { generate } from '../../services/generator'
import {
  HasName,
  HasFields,
  joinParsers,
  parseName,
  parseFields,
  ImportDeclaration,
} from '../../services/generator/target'
import * as path from 'path'
import { templates } from '../../templates'
import { checkItIsABoosterProject } from '../../services/project-checker'

export default class Command extends Oclif.Command {
  public static description = 'create a new command'
  public static flags = {
    help: Oclif.flags.help({ char: 'h' }),
    fields: Oclif.flags.string({
      char: 'f',
      description: 'field that this command will contain',
      multiple: true,
    }),
  }

  public static args = [{ name: 'commandName' }]

  public async run(): Promise<void> {
    return this.runWithErrors().catch(console.error)
  }

  private async runWithErrors(): Promise<void> {
    const { args, flags } = this.parse(Command)
    const fields = flags.fields || []
    if (!args.commandName)
      return Promise.reject("You haven't provided a command name, but it is required, run with --help for usage")
    return run(args.commandName, fields)
  }
}

type CommandInfo = HasName & HasFields

const run = async (name: string, rawFields: Array<string>): Promise<void> =>
  Script.init(`boost ${Brand.energize('new:command')} 🚧`, joinParsers(parseName(name), parseFields(rawFields)))
    .step('Verifying project', checkItIsABoosterProject)
    .step('Creating new command', generateCommand)
    .info('Command generated!')
    .done()

function generateImports(info: CommandInfo): Array<ImportDeclaration> {
  const commandFieldTypes = info.fields.map((f) => f.type)
  const commandUsesUUID = commandFieldTypes.some((type) => type == 'UUID')

  const componentsFromBoosterTypes = ['Register']
  if (commandUsesUUID) {
    componentsFromBoosterTypes.push('UUID')
  }

  return [
    {
      packagePath: '@boostercloud/framework-core',
      commaSeparatedComponents: 'Command',
    },
    {
      packagePath: '@boostercloud/framework-types',
      commaSeparatedComponents: componentsFromBoosterTypes.join(', '),
    },
  ]
}

const generateCommand = (info: CommandInfo): Promise<void> =>
  generate({
    name: info.name,
    extension: '.ts',
    placementDir: path.join('src', 'commands'),
    template: templates.command,
    info: {
      imports: generateImports(info),
      ...info,
    },
  })
