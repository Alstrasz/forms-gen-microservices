import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from 'rmq/rmq';
import { RmqOk, RmqResponse, RMQ_CODES } from 'rmq/rmq/responses';
import { CreateFormResponseDto } from './dto/create_form_response.dto';
import { CompleteForm, CompleteFormResponse, ShortForm } from 'prisma-forms/prisma-forms';
import { CreateFormDto } from './dto/create_form.dto';

@Injectable()
export class FormsService {
    constructor ( private readonly amqp_connection: AmqpConnection ) { }

    default_rmq_handler<T = any> ( response: RmqResponse<T> ): T {
        if ( response.status == RMQ_CODES.OK ) {
            return response.data;
        } else {
            throw new ServiceUnavailableException( response.data );
        }
    }

    /**
     * Warning: nonlocal function. Calls similar function from form-db service
     *
     * @param {number} form_id
     * @return {*}  {Promise<Array<CompleteFormResponse>>}
     * @memberof FormsService
     */
    async get_all_responses ( form_id: number ): Promise<Array<CompleteFormResponse>> {
        return this.amqp_connection.request<RmqOk<Array<CompleteFormResponse>>>( {
            exchange: EXCHANGES.SHARED_FORMS,
            routingKey: 'form.response.get_all',
            payload: form_id,
            timeout: 5000,
        } ).then( this.default_rmq_handler );
    }

    /**
     * Warning: nonlocal function. Calls similar function from form-db service
     *
     * @param {number} form_id
     * @param {CreateFormResponseDto} create_form_response_dto
     * @memberof FormsService
     */
    async create_response ( form_id: number, create_form_response_dto: CreateFormResponseDto ) {
        this.amqp_connection.publish(
            EXCHANGES.SHARED_FORMS,
            'form.response.post',
            { form_id, create_form_response_dto },
        );
    }

    /**
     * Warning: nonlocal function. Calls similar function from form-db service
     *
     * @param {number} id
     * @return {*}  {(Promise<CompleteForm | null>)}
     * @memberof FormsService
     */
    async get_form_by_id ( id: number ): Promise<CompleteForm | null> {
        return this.amqp_connection.request<RmqOk<CompleteForm | null>>( {
            exchange: EXCHANGES.SHARED_FORMS,
            routingKey: 'form.get_by_id',
            payload: id,
            timeout: 5000,
        } ).then( this.default_rmq_handler );
    }

    /**
     * Warning: nonlocal function. Calls similar function from form-db service
     *
     * @return {*}  {Promise<Array<ShortForm>>}
     * @memberof FormsService
     */
    async get_all_forms (): Promise<Array<ShortForm>> {
        return this.amqp_connection.request<RmqOk<Array<ShortForm>>>( {
            exchange: EXCHANGES.SHARED_FORMS,
            routingKey: 'form.get_all',
            payload: '',
            timeout: 5000,
        } ).then( this.default_rmq_handler );
    }

    /**
     * Warning: nonlocal function. Calls similar function from form-db service
     *
     * @param {CreateFormDto} create_form_response_dto
     * @memberof FormsService
     */
    async create_form ( create_form_response_dto: CreateFormDto ) {
        this.amqp_connection.publish(
            EXCHANGES.SHARED_FORMS,
            'form.post',
            create_form_response_dto,
        );
    }
}
