import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeTypeDescription,
	INodeExecutionData,
	INodeType
} from 'n8n-workflow';

import { messageBirdApiRequest } from './GenericFunctions';

export class MessageBird implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MessageBird',
		name: 'messageBird',
		icon: 'file:messagebird.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send SMS',
		defaults: {
			name: 'MessageBird',
			color: '#cf272d'
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'messageBirdApi',
				required: true
			}
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'SMS',
						value: 'sms'
					}
				],
				default: 'sms',
				description: 'The resource to operate on.'
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['sms']
					}
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send text messages (SMS)'
					}
				],
				default: 'send',
				description: 'The operation to perform.'
			},

			// ----------------------------------
			//         sms:send
			// ----------------------------------
			{
				displayName: 'From',
				name: 'originator',
				type: 'string',
				default: '',
				placeholder: '14155238886',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['sms']
					}
				},
				description: 'The number from which to send the message'
			},
			{
				displayName: 'To',
				name: 'recipients',
				type: 'string',
				default: '',
				placeholder: '14155238886',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['sms']
					}
				},
				description: 'all recipients separated by commas'
			},

			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['send'],
						resource: ['sms']
					}
				},
				description: 'The message to be send'
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Fields',
				default: {},
				options: [
					{
						displayName: 'Group Ids',
						name: 'groupIds',
						placeholder: '1,2',
						type: 'string',
						default: '',
						description:
							'group ids separated by commas, If provided recipients can be omitted'
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{
								name: 'sms',
								value: 'sms'
							},
							{
								name: 'binary',
								value: 'binary'
							},
							{
								name: 'flash',
								value: 'flash'
							}
						],
						default: '',
						description:
							'The type of message.<br /> Values can be: sms, binary, or flash.'
					},
					{
						displayName: 'Reference',
						name: 'reference',
						type: 'string',
						default: '',
						description: 'A client reference.'
					},
					{
						displayName: 'Report Url',
						name: 'reportUrl',
						type: 'string',
						default: '',
						description:
							'The status report URL to be used on a per-message basis.<br /> Reference is required for a status report webhook to be sent.'
					},
					{
						displayName: 'Validity',
						name: 'validity',
						type: 'number',
						default: '',
						description: 'The amount of seconds that the message is valid.'
					},
					{
						displayName: 'Gateway',
						name: 'gateway',
						type: 'number',
						default: '',
						description: 'The SMS route that is used to send the message.'
					},
					//hash
					{
						displayName: 'Type Details',
						name: 'typeDetails',
						type: 'string',
						default: '',
						description:
							'A hash with extra information.<br /> Is only used when a binary message is sent.'
					},

					{
						displayName: 'Datacoding',
						name: 'datacoding',
						type: 'string',
						default: '',
						description:
							'Using unicode will limit the maximum number of characters to 70 instead of 160'
					},
					{
						displayName: 'Mclass',
						name: 'mclass',
						type: 'number',
						placeholder: 'permissible values from 0-3',
						typeOptions: {
							minValue: 0,
							maxValue: 3
						},
						default: '',
						description:
							'Indicated the message type. 1 is a normal message, 0 is a flash message.'
					},
					//date-time format
					{
						displayName: 'Scheduled Date-time',
						name: 'scheduledDatetime',
						type: 'string',
						default: '',
						placeholder: '2011-08-30T09:30:16.768-04:00',
						description:
							'The scheduled date and time of the message in RFC3339 format (Y-m-dTH:i:sP).'
					},
					//date-time format
					{
						displayName: 'Created Date-time',
						name: 'createdDatetime',
						type: 'string',
						placeholder: '2011-08-30T09:30:16.768-04:00',
						default: '',
						description:
							'The date and time of the creation of the message in RFC3339 format (Y-m-dTH:i:sP).'
					}
				]
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		let operation: string;
		let resource: string;

		// For POST
		let Body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: string;

		for (let i = 0; i < items.length; i++) {
			qs = {};

			resource = this.getNodeParameter('resource', i) as string;
			operation = this.getNodeParameter('operation', i) as string;

			if (resource === 'sms') {
				if (operation === 'send') {
					// ----------------------------------
					//         sms:send
					// ----------------------------------

					requestMethod = 'POST';
					const originator = this.getNodeParameter('originator', i) as string;
					const body = this.getNodeParameter('message', i) as string;

					Body = {
						recipients: [],
						originator,
						body
					};
					const additionalFields = this.getNodeParameter(
						'additionalFields',
						i
					) as IDataObject;

					if (additionalFields.groupIds) {
						Body.groupIds = additionalFields.groupIds as string;
					}
					if (additionalFields.type) {
						Body.type = additionalFields.type as string;
					}
					if (additionalFields.reference) {
						Body.reference = additionalFields.reference as string;
					}
					if (additionalFields.reportUrl) {
						Body.reportUrl = additionalFields.reportUrl as string;
					}
					if (additionalFields.validity) {
						Body.validity = additionalFields.reportUrl as number;
					}
					if (additionalFields.gateway) {
						Body.gateway = additionalFields.gateway as string;
					}
					if (additionalFields.typeDetails) {
						Body.typeDetails = additionalFields.typeDetails as string;
					}
					if (additionalFields.datacoding) {
						Body.datacoding = additionalFields.datacoding as string;
					}
					if (additionalFields.mclass) {
						Body.mclass = additionalFields.mclass as number;
					}
					if (additionalFields.scheduledDatetime) {
						Body.scheduledDatetime = additionalFields.scheduledDatetime as string;
					}
					if (additionalFields.createdDatetime) {
						Body.createdDatetime = additionalFields.createdDatetime as string;
					}

					const receivers = this.getNodeParameter('recipients', i) as string;

					Body.recipients = receivers.split(',').map(function(item) {
						return parseInt(item, 10);
					});
				} else {
					throw new Error(`The operation "${operation}" is not known!`);
				}
			} else {
				throw new Error(`The resource "${resource}" is not known!`);
			}

			const responseData = await messageBirdApiRequest.call(
				this,
				requestMethod,
				Body,
				qs
			);

			returnData.push(responseData as IDataObject);
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
